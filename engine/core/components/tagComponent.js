import { UUID } from "../../util/uuid.js";
import { Component } from "./component.js";

export class TagComponent extends Component {
    name;

    initialize(configuration = {}) {
        this.name = configuration.name || UUID.generate();
    }
}