import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'path';
import fs from 'fs';
import * as Yup from 'yup';

export const ConfigValidationSchema= Yup.object({
  HOST: Yup.string().default('127.0.0.1'),
  PORT: Yup.number().default(9000),
  PASSWORD: Yup.string(),
  FILE_CACHE_DB: Yup.string()
    .default(path.join(process.cwd(), 'data', 'cache.db')),
  WEB_GENERATOR_API_URL: Yup.string()
    .required(),
  WEB_OUTPUT_PATH: Yup.string()
    .required()
    .test('is-valid-path', ({ label }) => {
      return `${label} is not a valid path`;
    }, (value, context) => {
      if (!fs.existsSync(value)) return context.createError({ message: `"${value}" is not exist.`, path: context.path })
      if (!fs.lstatSync(value).isDirectory()) return context.createError({ message: `"${value}" is not a directory.`, path: context.path })
      return true
    }),
})
export type Config = Yup.InferType<typeof ConfigValidationSchema>;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.example', '.env.local', '.env'],
      validate: (config) => {
        try {
          return ConfigValidationSchema.validateSync(config)
        } catch (error: any) {
          throw new Error(`Config Validation Error ${error.path}: ${error.message}`)
        }
      },
    }),
  ],
})
export class AppConfigModule {}
