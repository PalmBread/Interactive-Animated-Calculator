document.querySelectorAll('button').forEach(button => { button.setAttribute('tabindex', '-1'); });

output = (input) => { document.getElementById("output").value = input; }

function fixExpression(expression) {
    if (expression.name === "Expression" && Array.isArray(expression.value)) {
        expression.value.forEach(element => {
            if (element && element.name === "Expression") {
                fixExpression(element);
            }
        });

        let i = 0;
        while (i < expression.value.length - 1) {
            let current = expression.value[i];
            let next = expression.value[i + 1];
            if (current && next && current.name === "SimpleFraction" && next.name === "SimpleFraction") {
                let combined = current.con(next);
                expression.value.splice(i, 2, combined);
            } else {
                i++;
            }
        }
    }
    return expression;
}

function solve(expression) {
    let result = "";
    let log = (t1 = "", t2 = "") => {
        result += t1 + " " + t2 + "\n";
    }

    let copy = expression.copy();

    copy = fixExpression(copy);

    log("Problem:", copy.toString());
    log();
    log("Solution:");
    log("0:", copy.toString());

    let steps = 1;
    while (copy.next().length !== 0) {
        log(`${steps}:`, copy.step());
        steps++;
    }

    return result;
}


HANDLER = {
    "press": {
        "Error":  (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            console.error(`"${key}" is not a valid key.`);
        },
        "SimpleFraction": (data) => {
            let { key, type, lowest_parenthesis, depth, selected } = data;
            
            if (KEYBOARD.selectedElement().selected !== undefined && KEYBOARD.selectedElement().selected.name === "Expression") {
                KEYBOARD.press(13); // press Operation [Multiplication]
            }

            lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new SimpleFraction(key));
            KEYBOARD.selected[depth] += 1;
        },
        "Expression": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            
            //Parenthesis Open
            if (type === 10) {
                if (selected == undefined) {
                    lowest_parenthesis.add(new Expression());
                    KEYBOARD.selected.push(0);
                }

                else if (selected instanceof SimpleFraction) {
                    KEYBOARD.press(13); // press Operation [Multiplication]
                    KEYBOARD.press(10); // press Expression [Open Parenthesis]
                }

                else if (selected instanceof Operation) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth] + 1, 0, new Expression());
                    KEYBOARD.selected[depth] += 1;
                    KEYBOARD.selected.push(0);
                }
            }

            //Parenthesis Close
            else if (type === 11) {
                if (depth !== 0) {
                    KEYBOARD.selected.pop();
                }
            }
        },
        "Operation": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            
            lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
            KEYBOARD.selected[depth] += 1;
        },
        "ComplexFraction": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;

        },
        "Solve": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            document.getElementById("console").value = solve(EQUATION.left);
        },
        "Delete": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;

            if (KEYBOARD.selectedElement().selected === undefined && depth !== 0) {
                KEYBOARD.selected.pop();
                KEYBOARD.selectedElement().lowest_parenthesis.value.splice(KEYBOARD.selected[depth - 1] - 1, 1);
                KEYBOARD.selected[depth - 1] -= 1;
            }
            
            else if (KEYBOARD.selectedElement().selected.name === "Expression") {
                let length = KEYBOARD.selectedElement().selected.value.length;
                KEYBOARD.selected.push(length);
            } else {
                lowest_parenthesis.value.splice(KEYBOARD.selected[depth] - 1, 1);
                KEYBOARD.selected[depth] -= 1;
            }
        },
        "Clear": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            EQUATION.left.value = [];
            EQUATION.right.value = [];
            KEYBOARD.selected = [0];
        },
        "Left": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            
            if (KEYBOARD.selectedElement().selected !== undefined && KEYBOARD.selectedElement().selected.name === "Expression") {
                let length = KEYBOARD.selectedElement().selected.value.length;
                KEYBOARD.selected.push(length);
                return;
            }

            KEYBOARD.selected[depth] -= 1;

            if (KEYBOARD.selected[depth] < 0) {
                if (depth === 0) {
                    KEYBOARD.selected[depth] = 0;
                } else {
                    KEYBOARD.selected.pop();
                    KEYBOARD.selected[depth - 1] -= 1;
                }
            }
        },
        "Right": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;

            KEYBOARD.selected[depth] += 1;

            if (depth !== 0 && KEYBOARD.selected[depth] >= lowest_parenthesis.value.length) {
                KEYBOARD.selected.pop();
            }
            
            else if (KEYBOARD.selectedElement().selected === undefined) {
                KEYBOARD.selected[depth] -= 1;
            }
            
            else if (KEYBOARD.selectedElement().selected.name === "Expression") {
                KEYBOARD.selected.push(0);
            }
        }
    }
}

KEYS = Array.from(document.getElementById("keyboard").children);
EQUATION = { left: new Expression(), right: new Expression(), active: "left" };

KEYBOARD = {
    "active_expression": "left",
    "selected": [0],
    "encoding": "0123456789()^*/+-=".split("").concat(["FRACTION", "SOLVE", "DELETE", "CLEAR", "LEFT", "RIGHT"]),
    "selectedElement": (depth = KEYBOARD.selected.length - 1) => {
        let lowest_parenthesis = EQUATION[EQUATION.active];

        for (let i = 0; i < depth; i++) {
            lowest_parenthesis = lowest_parenthesis.value[KEYBOARD.selected[i] - 1];
        }

        let selected = lowest_parenthesis.value[KEYBOARD.selected[depth] - 1];
        return { lowest_parenthesis, depth, selected };
    },
    "press": (event, parameters = {}) => {
        let key, type;

        if (typeof event === "number") {
            type = event;
            key = KEYBOARD.encoding[type];
        }

        else {
            key = event.srcElement.dataset.value;
            type = KEYBOARD.encoding.findIndex((element) => element === key);
        }

        let {lowest_parenthesis, depth, selected} = KEYBOARD.selectedElement();

        if (selected instanceof Operation && selected.invisible) {
            KEYBOARD.press(20); //Delete
            KEYBOARD.press(key); //Expression
            return;
        }

        let data = {key, type, lowest_parenthesis, depth, selected, parameters};
    
        switch (true) {
            case type == -1: HANDLER.press.Error(data); break;
            case type <= 9:  HANDLER.press.SimpleFraction(data); break;
            case type <= 11: HANDLER.press.Expression(data); break;
            case type <= 16: HANDLER.press.Operation(data); break;
            case type == 18: HANDLER.press.ComplexFraction(data); break;
            case type == 19: HANDLER.press.Solve(data); break;
            case type == 20: HANDLER.press.Delete(data); break;
            case type == 21: HANDLER.press.Clear(data); break;
            case type == 22: HANDLER.press.Left(data); break;
            case type == 23: HANDLER.press.Right(data); break;
        }
        
        output(EQUATION[EQUATION.active].toString());
    }
}

KEYS.forEach(button => button.addEventListener("click", KEYBOARD.press));


addEventListener("keyup", event => {
    let button = KEYS.filter(element => element.dataset.keycode === event.key);
    button.forEach(button => button.click());
   
    //let _cursor = document.getElementById("cursor");
    //_cursor.value = String(KEYBOARD.selected);
})