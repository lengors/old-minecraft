import { DOMComponent } from "./component.js";

export class TextComponent extends DOMComponent {
    initialize(configuration = {}) {
        super.initialize({
            ...configuration,
            tagName: 'span'
        });
        let textTemplate = configuration.textTemplate || '${this.text}';
        this.textTemplateEngine = new Function(`return \`${textTemplate}\`;`);
        if (configuration.text)
            this.setText(configuration);
    }

    getText() {
        return this.element.innerText;
    }

    setText(configuration = {}) {
        this.element.innerText = this.textTemplateEngine.call(configuration);
    }
}