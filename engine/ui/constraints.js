import { Debug } from "../core/debug.js";
import { Reflection } from "../util/reflection.js";
import { ArgumentsParser } from "../util/parser.js";

export class Constraints {
    static centerX = new ArgumentsParser()
        .on([ArgumentsParser.ANYTHING], element => element.setPositionX((element.getParent().getWidth() - element.getWidth()) * 0.5))
        .bind();

    static centerY = new ArgumentsParser()
        .on([ArgumentsParser.ANYTHING], element => element.setPositionY((element.getParent().getHeight() - element.getHeight()) * 0.5))
        .bind();

    static height = new ArgumentsParser()
        .on([ArgumentsParser.ANYTHING], height => {
            return element => element.setHeight(Reflection.isCallable(height) ? height(element.getParent().getHeight()) : height);
        }).bind();

    static left = new ArgumentsParser()
        .on([Number.isFinite], left => {
            return element => element.setPositionX(Reflection.isCallable(left) ? left(element.getParent().getWidth()) : left);
        }).bind();

    static margins = new ArgumentsParser()
        .on([Reflection.isArray], margins => {
            switch (margins.length) {
                case 1:
                    return Constraints.margins({
                        top: margins[0],
                        left: margins[0],
                        right: margins[0],
                        bottom: margins[0],
                    });
                case 2:
                    return Constraints.margins({
                        top: margins[0],
                        left: margins[1],
                        right: margins[1],
                        bottom: margins[0],
                    });
                case 3:
                    return Constraints.margins({
                        top: margins[0],
                        left: margins[1],
                        right: margins[1],
                        bottom: margins[2],
                    });
                case 4:
                    return Constraints.margins({
                        top: margins[0],
                        left: margins[3],
                        right: margins[1],
                        bottom: margins[2],
                    });
                default:
                    Debug.assert(false);
            }
        }).on([Reflection.isCallable], margins => Constraints.margins({
            top: margins,
            left: margins,
            right: margins,
            bottom: margins,
        })).on([Number.isFinite], margins => Constraints.margins({
            top: margins,
            left: margins,
            right: margins,
            bottom: margins,
        })).on([ArgumentsParser.ANYTHING], margins => {
            return element => {
                const top = Reflection.isCallable(margins.top) ? margins.top(element.getParent().getHeight()) : margins.top;
                const left = Reflection.isCallable(margins.left) ? margins.left(element.getParent().getWidth()) : margins.left;
                const right = Reflection.isCallable(margins.right) ? margins.right(element.getParent().getWidth()) : margins.right;
                const bottom = Reflection.isCallable(margins.bottom) ? margins.bottom(element.getParent().getHeight()) : margins.bottom;
                element.setPositionY(top);
                element.setPositionX(left);
                element.setWidth(element.getParent().getWidth() - left - right);
                element.setHeight(element.getParent().getHeight() - top - bottom);
            };
        }).bind();

    static percentage = new ArgumentsParser()
        .on([Number.isFinite], percentage => {
            const decimal = percentage / 100;
            return value => value * decimal;
        }).bind();

    static top = new ArgumentsParser()
        .on([Number.isFinite], top => {
            return element => element.setPositionY(Reflection.isCallable(top) ? top(element.getParent().getWidth()) : top);
        }).bind();

    static width = new ArgumentsParser()
        .on([ArgumentsParser.ANYTHING], width => {
            return element => element.setWidth(Reflection.isCallable(width) ? width(element.getParent().getWidth()) : width);
        }).bind();
}