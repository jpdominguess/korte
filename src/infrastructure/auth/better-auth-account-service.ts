import type { AccountService, NewAccount } from "@/application/ports";
import { DomainError } from "@/domain/shared/errors";
import { auth } from "./auth";

export class BetterAuthAccountService implements AccountService {
  async createCredentialAccount(account: NewAccount) {
    const context = await auth.$context;
    const email = account.email.toLowerCase();
    if (await context.internalAdapter.findUserByEmail(email)) {
      throw new DomainError("Já existe uma conta com esse e-mail.", "conflict");
    }

    const user = await context.internalAdapter.createUser({
      name: account.name,
      email,
      phone: account.phone,
      role: account.role,
      emailVerified: true,
    }, { method: "email-password" });
    await context.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await context.password.hash(account.password),
    });
    return user.id;
  }
}
