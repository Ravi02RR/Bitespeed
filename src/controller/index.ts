import type { Request, Response } from "express";
import { prisma } from "../db/index";
import redisClient from "../redis/index";

/***
 * step1: check if email or phone number is provided
 * step2: check if contact exists in redis cache
 * step3: if not found in redis, query the database
 * step4: if no matches, create a new contact
 * step5: gather all linked contact IDs
 * step6: identify the true primary contact
 * step7: ensure only one primary contact, rest become secondaries
 * step8: add secondary contact if new email/phone
 * step9: build final response with primary contact and linked contacts
 * step10: return the response with primary contact ID, emails, phone numbers, and secondary contact IDs
 *
 *
 *
 * TODO:
 * - Add validation for email and phone number formats
 * - for primary contact we can add BullMQ to handle the creation of secondary contacts in the background
 * - Add more detailed error handling
 *
 */

class UserController {
  static identifyContact = async (req: Request, res: Response) => {
    try {
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res
          .status(400)
          .json({ error: "Email or phoneNumber is required" });
      }
      const cacheKey = `contact:lookup:${email || ""}:${phoneNumber || ""}`;
      const cachedIds = await redisClient.smembers(cacheKey);
      console.log(`[Cache] Lookup for ${cacheKey}:`, cachedIds);

      let matchedContacts;
      if (cachedIds.length > 0) {
        matchedContacts = await prisma.contact.findMany({
          where: { id: { in: cachedIds.map(Number) } },
          orderBy: { createdAt: "asc" },
        });
      } else {
        matchedContacts = await prisma.contact.findMany({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(phoneNumber ? [{ phoneNumber }] : []),
            ],
          },
          orderBy: { createdAt: "asc" },
        });

        console.log(`[DB] Found ${matchedContacts.length} contacts`);
        if (matchedContacts.length > 0) {
          const ids = matchedContacts.map((c) => c.id.toString());
          await redisClient.sadd(cacheKey, ...ids);
          await redisClient.expire(cacheKey, 3600);
        }
      }
      if (matchedContacts.length === 0) {
        const newContact = await prisma.contact.create({
          data: { email, phoneNumber, linkPrecedence: "primary" },
        });

        await redisClient.sadd(cacheKey, String(newContact.id));
        await redisClient.expire(cacheKey, 3600);

        return res.status(200).json({
          contact: {
            primaryContactId: newContact.id,
            emails: [newContact.email].filter(Boolean),
            phoneNumbers: [newContact.phoneNumber].filter(Boolean),
            secondaryContactIds: [],
          },
        });
      }
      const linkedIds = new Set<number>();
      matchedContacts.forEach((c) => {
        linkedIds.add(c.id);
        if (c.linkedId) linkedIds.add(c.linkedId);
      });

      const allContacts = await prisma.contact.findMany({
        where: {
          OR: [
            { id: { in: [...linkedIds] } },
            { linkedId: { in: [...linkedIds] } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      const primary = allContacts.find((c) => c.linkPrecedence === "primary")!;
      const allPrimaries = allContacts.filter(
        (c) => c.linkPrecedence === "primary"
      );
      for (const contact of allPrimaries) {
        if (contact.id !== primary.id) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              linkPrecedence: "secondary",
              linkedId: primary.id,
            },
          });
        }
      }
      const existingEmails = new Set(
        allContacts.map((c) => c.email).filter(Boolean)
      );
      const existingPhones = new Set(
        allContacts.map((c) => c.phoneNumber).filter(Boolean)
      );

      const isNewEmail = email && !existingEmails.has(email);
      const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

      if (isNewEmail || isNewPhone) {
        const secondary = await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: "secondary",
            linkedId: primary.id,
          },
        });

        await redisClient.sadd(cacheKey, String(secondary.id));
        await redisClient.expire(cacheKey, 3600);
      }
      const finalContacts = await prisma.contact.findMany({
        where: {
          OR: [{ id: primary.id }, { linkedId: primary.id }],
        },
        orderBy: { createdAt: "asc" },
      });

      const emails = [
        ...new Set(finalContacts.map((c) => c.email).filter(Boolean)),
      ];
      const phoneNumbers = [
        ...new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean)),
      ];
      const secondaryContactIds = finalContacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id);

      return res.status(200).json({
        contact: {
          primaryContactId: primary.id,
          emails,
          phoneNumbers,
          secondaryContactIds,
        },
      });
    } catch (error) {
      console.error("Error in identifyContact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default UserController;
