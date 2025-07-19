import express from "express";
const userRouter = express.Router();
import UserController from "../controller/index";

/**
 * @swagger
 * /api/identify:
 *   post:
 *     summary: Identify user contact (by email or phone)
 *     description: |
 *       Performs identity reconciliation by matching email and/or phoneNumber.
 *       If no match is found, a new primary contact is created. If matches exist,
 *       links all records and updates precedence.
 *     tags:
 *       - Identity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ravi848101mnb@gmail.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "9608527421"
 *     responses:
 *       200:
 *         description: Successful reconciliation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   type: object
 *                   properties:
 *                     primaryContactId:
 *                       type: number
 *                       example: 1
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ravi848101mnb@gmail.com"]
 *                     phoneNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["+919608527421"]
 *                     secondaryContactIds:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [2, 3]
 *       400:
 *         description: Missing email or phone number
 *       500:
 *         description: Internal server error
 */
userRouter.post("/identify", UserController.identifyContact);

export default userRouter;
