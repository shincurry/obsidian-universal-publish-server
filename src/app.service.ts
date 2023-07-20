import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import Bluebird from 'bluebird';
import JSZip from 'jszip';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Config } from './config.module';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

export type VaultFile = {
  sha1: string;
  path: string;
}
export type VaultFileDiff = {
  cached: VaultFile[];
  uncached: VaultFile[];
}

@Injectable()
export class AppService {

  @Inject(CACHE_MANAGER) private readonly cache!: Cache;
  @Inject(ConfigService) private readonly configService!: ConfigService<Config>;

  async prepare(filelist: VaultFile[]) {
    const exists = await Bluebird.map(filelist, async (file) => {
      return {
        info: file,
        exist: !!(await this.cache.get(file.sha1)),
      }
    }, { concurrency: 3 })

    const cached = exists.filter((i) => i.exist).map((i) => i.info)
    const uncached = exists.filter((i) => !i.exist).map((i) => i.info)

    return {
      diff: { cached, uncached },
    }
  }

  async publish(publishId: string, zippack: Buffer, diff?: VaultFileDiff) {
    const sourceZip = await JSZip.loadAsync(zippack);

    if (diff) {
      for (const meta of diff.uncached) {
        try {
          const fileObj = sourceZip.file(meta.path)
          if (fileObj) {
            const buffer = await fileObj.async('nodebuffer')
            await this.cache.set(meta.sha1, buffer.toString('binary'), 1000 * 60 * 60 * 24 * 7);
          }
        } catch (error) {
          console.error(error)
        }
      }
      for (const meta of diff.cached) {
        const bufferString = await this.cache.get(meta.sha1) as any;
        if (bufferString) {
          sourceZip.file(meta.path, Buffer.from(bufferString, 'binary'));
        }
      }
    }

    const webGeneratorApiUrl = this.configService.get<string>("WEB_GENERATOR_API_URL")!
    const formdata = new FormData()
    formdata.append('file', await sourceZip.generateAsync({ type: 'nodebuffer' }), 'source.zip')
    const apiUrl = new URL('/generate', webGeneratorApiUrl).href
    const response = await axios.post(apiUrl, formdata, {
      headers: {
        ...formdata.getHeaders(),
      },
      responseType: 'arraybuffer',
    })

    const webOutputRootPath = this.configService.get<string>("WEB_OUTPUT_PATH")!
    const webOutputPath = path.join(webOutputRootPath, publishId);
    const websiteZip = await JSZip.loadAsync(Buffer.from(response.data));

    await fs.emptyDir(webOutputPath)
    for (const filename in websiteZip.files) {
      if (websiteZip.files[filename].dir) continue
      const buffer = await websiteZip.files[filename].async('nodebuffer')
      const outputFilePath = path.join(webOutputPath, filename)
      const outputDirPath = path.dirname(outputFilePath)
      await fs.mkdirp(outputDirPath)
      fs.writeFile(outputFilePath, buffer)
    }

  }

}
