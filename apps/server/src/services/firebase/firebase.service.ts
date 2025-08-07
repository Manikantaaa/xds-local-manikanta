import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";
// import { auth } from './firebase.config';
// import { signInWithEmailAndPassword } from "firebase/auth";
@Injectable()
export class FirebaseService {
  async updateEmail(oldEmail: string, newEmail: string) {
    const user = await admin.auth().getUserByEmail(oldEmail);
    await admin.auth().updateUser(user.uid, {
      email: newEmail,
    });
  }

  // async verifyPassword(email: string, password: string): Promise<boolean> {
  //   try {
  //     const firebaseUser = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password,
  //     );
  //     if(firebaseUser) {
  //       return true;
  //     }
  //     else{
  //       return false;
  //     }
  //   } catch (error) {
  //     return false;
  //   }
  // }
}
