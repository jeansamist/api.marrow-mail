import { type UserSchema } from '#database/schema'
import User from '#models/user'
import { type ModelProps } from '#utils/generics'
export default class UserRepository {
  private model = User
  get getModel(): typeof User {
    return this.model
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.query().where('email', email).first()
  }

  async findByEmailVerified(email: string): Promise<User | null> {
    return this.model.query().where('email', email).where('email_verified', true).first()
  }
  async findByEmailNotVerified(email: string): Promise<User | null> {
    return this.model.query().where('email', email).where('email_verified', false).first()
  }

  async findByEmailAndResetPasswordToken(
    email: string,
    resetPasswordToken: string
  ): Promise<User | null> {
    return this.model
      .query()
      .where('email', email)
      .where('reset_password_token', resetPasswordToken)
      .first()
  }

  async findByEmailAndEmailVerificationCode(
    email: string,
    emailVerificationCode: string
  ): Promise<User | null> {
    return this.model
      .query()
      .where('email', email)
      .where('email_verification_code', emailVerificationCode)
      .first()
  }
  async findById(id: number): Promise<User | null> {
    return this.model.find(id)
  }
  async create(data: ModelProps<UserSchema>): Promise<User> {
    return this.model.create(data)
  }

  async update(user: User, data: Partial<ModelProps<UserSchema>>): Promise<User> {
    return user.merge(data).save()
  }

  async delete(user: User): Promise<void> {
    await user.delete()
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.model.query().where('email', email).delete()
  }

  async deleteById(id: number): Promise<void> {
    await this.model.query().where('id', id).delete()
  }
}
