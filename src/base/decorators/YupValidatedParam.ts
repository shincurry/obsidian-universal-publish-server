import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import Yup from "yup";

export function YupValidatedParam<T extends any>(key: string, validationSchema: Yup.Schema<T>) {
  return createParamDecorator<T>(
    async (data, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const param = request.params[key];
      try {
        return await validationSchema.required().validate(param);
      } catch (error: any) {
        console.error(error)
        throw new HttpException(`Http request param validation error ${key}: ${error.message}`, HttpStatus.BAD_REQUEST)
      }
    },
  )();
}
