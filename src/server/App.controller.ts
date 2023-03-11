import { Controller, FileTypeValidator, HttpStatus, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './App.service';
import * as Yup from 'yup';
import { YupValidatedBody } from '../base/decorators/YupValidatedBody.decorator';
import { YupValidatedParam } from '../base/decorators/YupValidatedParam.decorator';

const VaultFileValidationSchema = Yup.object({
  sha1: Yup.string().required()
    .test('is-valid-sha1-value', (value, context) => {
      const isValid = /^[a-fA-F0-9]{40}$/.test(value);
      if (!isValid) return context.createError({ message: `"${value}" is not a valid SHA1.`, path: context.path })
      return true;
    }),
  path: Yup.string().required(),
})
const PublishPrepareBodyValidationSchema = Yup.object({
  filelist: Yup.array(VaultFileValidationSchema.required()).required(),
})
const PublishBodyValidationSchema = Yup.object({
  diff: Yup.object({
    cached: Yup.array(VaultFileValidationSchema).required(),
    uncached: Yup.array(VaultFileValidationSchema).required(),
  }).optional().json(),
})

const PublishIdParamValidationSchema = Yup
  .string().min(1).max(20)
  .matches(/[a-zA-Z0-9-]+/);

@Controller('/publish')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/:publishId/prepare')
  async preparePublish(
    @YupValidatedParam("publishId", PublishIdParamValidationSchema) _publishId: string,
    @YupValidatedBody(PublishPrepareBodyValidationSchema) body: Yup.InferType<typeof PublishPrepareBodyValidationSchema>,
  ) {
    return await this.appService.prepare(body.filelist)
  }

  @Post('/:publishId')
  @UseInterceptors(FileInterceptor('zippack'))
  async publish(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'application/zip' }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        fileIsRequired: true,
      })
    ) zippack: Express.Multer.File,
    @YupValidatedParam("publishId", PublishIdParamValidationSchema) publishId: string,
    @YupValidatedBody(PublishBodyValidationSchema) body: Yup.InferType<typeof PublishBodyValidationSchema>,
  ) {
    await this.appService.publish(publishId, zippack.buffer, body.diff);
  }

}
