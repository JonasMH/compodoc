import { IHtmlEngineHelper, IHandlebarsOptions } from './html-engine-helper.interface';
import { JsdocTagInterface } from '../../interfaces/jsdoc-tag.interface';
import { PlantUmlService } from '../../plant-uml.service';
import * as fs from 'fs-extra';


export class JsdocDiagramCommentHelper implements IHtmlEngineHelper {
    constructor(private plantUmlService: PlantUmlService = new PlantUmlService()) {

    }

    /**
     * @param context Handlebar context
     * @param jsdocTags list of tags
     * @param file file, ex: test/src/todomvc-ng2/src/app/home/home.component.ts
     */
    public helperFunc(context: any, jsdocTags: Array<JsdocTagInterface>, file: string, options: IHandlebarsOptions) {
        let results = jsdocTags
            .filter(x => x.tagName)
            .filter(x => x.tagName.text === 'diagram');

        if (results.length === 0) {
            return undefined;
        }

        let fileFolder = file.substring(0, file.lastIndexOf('/') + 1);
        context.diagrams = new Array();

        let promises = results.map(x => {
            const data = fs.readFileSync(fileFolder + x.comment);
            return this.plantUmlService
                .getDiagramFromPlantUml(data.toString())
                .then((image) => context.diagrams.push({base64Img: image.toString('base64')}));
        });

        return Promise.all(promises)
            .then(x => {
                return options.fn(context);
            });
    }
}