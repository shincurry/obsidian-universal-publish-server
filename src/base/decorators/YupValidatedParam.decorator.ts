import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import Yup, { ValidationError } from "yup";

export function YupValidatedParam<T extends any>(key: string, validationSchema: Yup.Schema<T>) {
  return createParamDecorator<T>(
    async (data, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const param = request.params[key];
      try {
        return await validationSchema.required().validate(param, { abortEarly: false });
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new HttpException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: error.errors,
            error: "Bad Request: ValidationError"
          }, HttpStatus.BAD_REQUEST)
        } else {
          throw error
        }
      }
    },
  )();
}
