import express from 'express';
import { forgetPass, google, signOut, signin, signup, verifyForgetPass } from '../controllers/auth-controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post('/google', google);
router.get('/signout', signOut)
router.post('/forget', forgetPass)
router.post('/reset-password/:token', verifyForgetPass)

export default router;