import { DOMComponent } from "./component.js";

export class MonitorComponent extends DOMComponent {
    initialize(configuration = {}) {
        super.initialize(configuration);
        this.set('margin', 0);
        this.set('padding', 0);
        this.setWidth('100vw');
        this.setHeight('100vh');
    }
}