import { passwordResetCollection } from "../config/db-client.js";

export async function createPasswordReset(data) {
  return await passwordResetCollection.insertOne({     //new password store
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    createdAt: new Date(),
  });
}

export async function getPasswordResetByTokenHash(tokenHash) {
  return await passwordResetCollection.findOne({   // check the valide reset token 
    tokenHash,
    expiresAt: {
      $gt: new Date(),
    },
  });
}

export async function deletePasswordReset(tokenHash) {
  return await passwordResetCollection.deleteOne({  //used reset token delete 
    tokenHash,
  });
}

export async function deleteUserPasswordResets(userId) {
  return await passwordResetCollection.deleteMany({  //existing password reset requests delete
    userId,
  });
}
