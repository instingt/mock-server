import * as express from 'express'
import {Response, Request} from 'express'
import {existsSync, readFileSync, readdirSync} from 'fs';
import {join} from "path";

const app = express();
const BASE_PATH = '/private/tmp/mock/src/'

interface Mock {
    data: any,
    headers?: MockHeader
}

interface MockHeader {
    [name: string]: string
}

app.get('*', function (req: Request, res: Response) {
    const mock = resolvePath(req.originalUrl, req.method);

    if (mock) {
        if (mock.headers) {
            Object.entries(mock.headers).forEach(function ([key, value]) {
                res.setHeader(key, value);
            });
        }

        res.json(mock.data);
        return;
    }

    res.status(404).send();
});

app.listen(8000, () => console.log('app listen on port 8000'));

function resolvePath(url: string, method: string): Mock | null {
    const resBaseDir = join(BASE_PATH, 'rest', url, '#', method);
    const resConfig = `${resBaseDir}/res`;

    if (!existsSync(resConfig)) {
        return null
    }

    const mocksDir = join(resBaseDir, 'mock');
    const resFileName = readFileSync(resConfig, 'utf-8').split('\n')[0];
    const dataFile = join(mocksDir, `${resFileName}.json`);
    const headersFile = join(mocksDir, `${resFileName}.headers.json`);

    if (!existsSync(dataFile)) {
        console.log(`Mock ${resFileName} not found in ${mocksDir}`);
        console.log(`Check you filepath ${dataFile}\n`);
        return null
    }

    const result: Mock = {
        data: JSON.parse(readFileSync(dataFile, 'utf-8'))
    };

    if (existsSync(headersFile)) {
        result.headers = JSON.parse(readFileSync(headersFile, 'utf-8'));
    }

    return result;
};
