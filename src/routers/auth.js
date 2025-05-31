import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
} from '../controllers/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import { registerSchema, loginSchema } from '../validation/auth.js';

const authRouter = Router();
authRouter.post(`/register`, validateBody(registerSchema), registerController);
authRouter.post(`/login`, validateBody(loginSchema), loginController);
authRouter.post(`/refresh`, refreshController);
export default authRouter;
