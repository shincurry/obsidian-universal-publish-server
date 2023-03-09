import { Controller, FileTypeValidator, HttpStatus, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {YupValidatedBody as YupValidatedBody } from '../base/decorators/YupValidatedBody';
import { AppService } from './App.service';
import * as Yup from 'yup';

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

@Controller('/publish')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/prepare')
  async preparePublish(
    @YupValidatedBody(PublishPrepareBodyValidationSchema) body: Yup.InferType<typeof PublishPrepareBodyValidationSchema>,
  ) {
    return await this.appService.prepare(body.filelist)
  }

  @Post('/')
  @UseInterceptors(FileInterceptor('zippack'))
  async publish(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'application/zip' }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        fileIsRequired: false,
      })
    ) zippack: Express.Multer.File,
    @YupValidatedBody(PublishBodyValidationSchema) body: Yup.InferType<typeof PublishBodyValidationSchema>,
  ) {
    await this.appService.publish(zippack.buffer, body.diff);
  }

}
