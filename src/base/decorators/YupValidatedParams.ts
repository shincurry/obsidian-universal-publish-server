import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import Yup from "yup";

export function YupValidatedParams<T extends Yup.Maybe<Yup.AnyObject>>(validationSchema: Yup.ObjectSchema<T>) {
  return createParamDecorator<T>(
    async (data, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const params = request.params;
      try {
        return await validationSchema.validate(params);
      } catch (error: any) {
        console.error(error)
        throw new HttpException(`Http request params validation error ${error.path}: ${error.message}`, HttpStatus.BAD_REQUEST)
      }
    },
  )();
}
