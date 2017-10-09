import { IHtmlEngineHelper } from './html-engine-helper.interface';
import { JsdocTagInterface } from '../../interfaces/jsdoc-tag.interface';

export class JsdocReturnsCommentHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, jsdocTags: Array<JsdocTagInterface>, options) {
        let result = jsdocTags
            .filter(x => x.tagName)
            .find(x => x.tagName.text === 'returns');

        return result ? result.comment : undefined;
    }
}