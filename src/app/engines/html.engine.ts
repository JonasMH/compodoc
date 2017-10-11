import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { logger } from '../../logger';
import { HtmlEngineHelpers } from './html.engine.helpers';
import { DependenciesEngine } from './dependencies.engine';
import { ConfigurationInterface } from '../interfaces/configuration.interface';

let pagePartial = require('../../templates/page.hbs');

export class HtmlEngine {
    private cache: { page: any } = {} as any;

    constructor(
        private handlebars,
        configuration: ConfigurationInterface,
        dependenciesEngine: DependenciesEngine) {

        const helper = new HtmlEngineHelpers();
        helper.registerHelpers(handlebars, configuration, dependenciesEngine);
    }

    public init(): Promise<void> {
        let partials = [
            'menu',
            'overview',
            'markdown',
            'modules',
            'module',
            'components',
            'component',
            'component-detail',
            'directives',
            'directive',
            'injectables',
            'injectable',
            'pipes',
            'pipe',
            'classes',
            'class',
            'interface',
            'routes',
            'index',
            'index-directive',
            'index-misc',
            'search-results',
            'search-input',
            'link-type',
            'block-method',
            'block-enum',
            'block-property',
            'block-index',
            'block-constructor',
            'block-typealias',
            'coverage-report',
            'miscellaneous-functions',
            'miscellaneous-variables',
            'miscellaneous-typealiases',
            'miscellaneous-enumerations',
            'additional-page'
        ];

        /*partials.forEach((x: any) => {
            this.handlebars.registerPartial(x.name, x.page);
        });*/
        this.cache.page = pagePartial;

        return Promise.resolve();
    }

    public render(mainData: any, page: any): Promise<string> {
        let o = mainData;
        (Object as any).assign(o, page);

        let template: any = this.handlebars.compile(this.cache.page);
        let result = template({
            data: o
        });

        return result;
    }

    public generateCoverageBadge(outputFolder, coverageData) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname + '/../src/templates/partials/coverage-badge.hbs'), 'utf8', (err, data) => {
                if (err) {
                    reject('Error during coverage badge generation');
                } else {
                    let template: any = this.handlebars.compile(data);
                    let result = template({
                        data: coverageData
                    });
                    let testOutputDir = outputFolder.match(process.cwd());
                    if (!testOutputDir) {
                        outputFolder = outputFolder.replace(process.cwd(), '');
                    }
                    fs.outputFile(path.resolve(outputFolder + path.sep + '/images/coverage-badge.svg'), result, (err1) => {
                        if (err1) {
                            logger.error('Error during coverage badge file generation ', err1);
                            reject(err1);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }
}
