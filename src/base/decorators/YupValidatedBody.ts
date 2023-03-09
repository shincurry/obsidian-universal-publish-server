import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";
import Yup from "yup";

export function YupValidatedBody<T extends Yup.Maybe<Yup.AnyObject>>(validationSchema: Yup.ObjectSchema<T>) {
  return createParamDecorator<T>(
    async (data, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<Request>();
      const body = request.body;
      try {
        return await validationSchema.validate(body);
      } catch (error: any) {
        console.error(error)
        throw new HttpException(`Http request body validation error ${error.path}: ${error.message}`, HttpStatus.BAD_REQUEST)
      }
    },
  )();
}
