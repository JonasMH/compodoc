import { IHtmlEngineHelper, IHandlebarsOptions } from './html-engine-helper.interface';
import { JsdocTagInterface } from '../../interfaces/jsdoc-tag.interface';
import { PlantUmlService } from '../../plant-uml.service';
import * as fs from 'fs-extra';


export class JsdocDiagramCommentHelper implements IHtmlEngineHelper {
    constructor(private plantUmlService: PlantUmlService = new PlantUmlService()) {

    }

    public helperFunc(context: any, jsdocTags: Array<JsdocTagInterface>, options: IHandlebarsOptions) {
        let result = jsdocTags
            .filter(x => x.tagName)
            .find(x => x.tagName.text === 'diagram');

        if (!result) {
            return undefined;
        }

        const data = fs.readFileSync('test/src/todomvc-ng2/src/app/home/' + result.comment);
        return this.plantUmlService.getDiagramFromPlantUml(data.toString())
            .then((image) => {
                context.base64Img = image.toString('base64');
                return options.fn(context);
            });
    }
}