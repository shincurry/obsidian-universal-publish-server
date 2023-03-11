import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";
import Yup, { ValidationError } from "yup";

export function YupValidatedBody<T extends Yup.Maybe<Yup.AnyObject>>(validationSchema: Yup.ObjectSchema<T>) {
  return createParamDecorator<T>(
    async (data, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<Request>();
      const body = request.body;
      try {
        return await validationSchema.validate(body, { abortEarly: false });
      } catch (error: any) {
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
