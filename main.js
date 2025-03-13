/*
To Do:
 - Replace the atrocious amount of nesting in this code [while making sure it still works] <-- VERY IMPORTANT
*/

//Make buttons unselectable by Tab
document.querySelectorAll('button').forEach(button => { button.setAttribute('tabindex', '-1'); });

output = (input) => { document.getElementById("output").value = input; }

function solve(expression) {
    let result = "";
    let log = (t1 = "", t2 = "") => {
        result += t1 + " " + t2 + "\n";
    }

    let copy = expression.copy();

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
            
            if (selected === undefined) {
                lowest_parenthesis.add(new SimpleFraction(key));
                KEYBOARD.special_selection = 1;
            }

            else if (selected instanceof Operation) {
                lowest_parenthesis.value.splice(KEYBOARD.selected[depth] + 1, 0, new SimpleFraction(key));
                KEYBOARD.selected[depth] += 1;
            }

            else if (selected instanceof SimpleFraction) {
                let value = selected.toString();
                let newValue = value.slice(0, KEYBOARD.special_selection) + key + value.slice(KEYBOARD.special_selection);
                lowest_parenthesis.value[KEYBOARD.selected[depth]] = new SimpleFraction(newValue);
                KEYBOARD.special_selection += 1;
            }

            else if (selected instanceof Expression) {
                if (KEYBOARD.special_selection === 1) {
                    KEYBOARD.press(13);
                    KEYBOARD.press(Number(type));
                } else {
                    KEYBOARD.press(13);
                    KEYBOARD.selected[depth] -= 1;
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new SimpleFraction(key));
                    KEYBOARD.special_selection = 1;
                }
            }
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
                if (KEYBOARD.selected[depth] >= lowest_parenthesis.value.length - 1) {
                    KEYBOARD.selected.pop();
                    KEYBOARD.special_selection = 1;
                }
            }
        },
        "Operation": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            if (selected === undefined) {
                lowest_parenthesis.add(new Operation(key));
                KEYBOARD.selected[depth] += 1;
            }

            else if (selected instanceof SimpleFraction) {
                if (selected.length == KEYBOARD.special_selection) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth] + 1, 0, new Operation(key));
                    KEYBOARD.selected[depth] += 1;
                    KEYBOARD.special_selection = 1;
                }
                
                else if (KEYBOARD.special_selection === 0) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
                    KEYBOARD.special_selection = 1;
                }

                else {
                    let value = selected.toString();
                    let x = value.slice(0, KEYBOARD.special_selection);
                    let y = value.slice(KEYBOARD.special_selection);

                    lowest_parenthesis.value[KEYBOARD.selected[depth]] = y;
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, x);
                    KEYBOARD.special_selection = 1;
                    KEYBOARD.selected[depth] += 1;
                }
            }
            
            else if (selected instanceof Operation) {
                KEYBOARD.selected[depth] += 1;
                lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
            }

            else if (selected instanceof Expression) {
                if (KEYBOARD.special_selection === 0) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
                    KEYBOARD.selected[depth] += 1;
                } else {
                    KEYBOARD.selected[depth] += 1;
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
                }
            }
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
            if (selected === undefined && depth > 0) {

                depth -= 1;
                lowest_parenthesis = KEYBOARD.selectedElement(depth).lowest_parenthesis;
                lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 1);   
                
                KEYBOARD.selected[depth] -= KEYBOARD.selected[depth] > 0;
                KEYBOARD.selected.pop();

                KEYBOARD.special_selection = 1;

            } else if (selected instanceof SimpleFraction) {
                let value = selected.toString();
                
                if (KEYBOARD.special_selection === 0) {
                    if (KEYBOARD.selected[depth] === 0) {
                        return;
                    }

                    KEYBOARD.selected[depth] -= 1
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 1);

                    if (KEYBOARD.selected[depth] !== 0) {
                        let value = lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 1).toString();
                        KEYBOARD.selected[depth] -= 1

                        let selected = KEYBOARD.selectedElement().selected;
                        KEYBOARD.special_selection = selected.length;

                        lowest_parenthesis.value[KEYBOARD.selected[depth]] = new SimpleFraction(selected.toString() + value);
                        }

                } else if (value.length === 1) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 1);
                    KEYBOARD.selected[depth] -= KEYBOARD.selected[depth] >= 1;

                    if (KEYBOARD.selected[depth] === 0) {
                        KEYBOARD.special_selection = 0;
                    }
                } else {
                    value = value.slice(0, KEYBOARD.special_selection - 1) + value.slice(KEYBOARD.special_selection);
                    
                    lowest_parenthesis.value[KEYBOARD.selected[depth]] = new SimpleFraction(value);
                    KEYBOARD.special_selection -= 1;
                }
            } else if (selected instanceof Expression) {
                KEYBOARD.selected.push(KEYBOARD.selectedElement().selected.value.length - 1);
            }

            else if (selected instanceof Operation) {
                if (KEYBOARD.special_selection === 0) {
                    HANDLER.press.Left(data);
                } else {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 1);
                    KEYBOARD.selected[depth] -= KEYBOARD.selected[depth] >= 1;

                    let newSelected = lowest_parenthesis.value[KEYBOARD.selected[depth]];
                    if (newSelected instanceof Operation || newSelected instanceof Expression) {
                        KEYBOARD.special_selection = 1;
                    } else if(newSelected instanceof SimpleFraction) {
                        KEYBOARD.special_selection = newSelected.length;
                    }
                }

            }
        },
        "Clear": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            EQUATION.left.value = [];
            EQUATION.right.value = [];
            KEYBOARD.selected = [0];
            KEYBOARD.special_selection = 0;
        },
        "Left": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;
            if (KEYBOARD.selected[depth] === 0 && KEYBOARD.special_selection == 0 && depth > 0) {
                KEYBOARD.selected.pop();
                KEYBOARD.special_selection = 0;
            }

            else if (selected instanceof SimpleFraction) {
                KEYBOARD.special_selection -= 1;

                if (KEYBOARD.special_selection < 0) {
                    if (KEYBOARD.selected[depth] == 0) {
                        KEYBOARD.special_selection = 0;
                    } else {
                        KEYBOARD.selected[depth] -= 1;

                        if (lowest_parenthesis.value[KEYBOARD.selected[depth]].name == "Operation") {
                            KEYBOARD.selected[depth] -= 1;
                            KEYBOARD.special_selection = lowest_parenthesis.value[KEYBOARD.selected[depth]].length;
                        }
                    }
                }
            }

            else if (selected instanceof Operation) {
                if (KEYBOARD.selected[depth] === 0) {
                    return;
                }

                let {lowest_parenthesis2, depth2, selected2} = KEYBOARD.selectedElement();
                
                KEYBOARD.selected[depth] -= 1;
                KEYBOARD.special_selection = selected2.length;
            }
        },
        "Right": (data) => {
            let { key, type, lowest_parenthesis, depth, selected, parameters } = data;

            if (KEYBOARD.selected[depth] === lowest_parenthesis.value.length - 1 && KEYBOARD.special_selection == lowest_parenthesis.value[lowest_parenthesis.value.length - 1].length  && depth > 0) {
                KEYBOARD.selected.pop();
                KEYBOARD.special_selection = 1;
            }

            else if (selected instanceof SimpleFraction) {
                if (selected.length <= KEYBOARD.special_selection) {
                    if (++KEYBOARD.selected[depth] >= lowest_parenthesis.value.length) {
                        KEYBOARD.selected[depth] -= 1;
                    } else {
                        KEYBOARD.special_selection = 1;
                        KEYBOARD.selected[depth]++;
                        KEYBOARD.special_selection = 0;
                    }
                } else {
                    KEYBOARD.special_selection += 1;
                }
            } else if (selected instanceof Operation) {
                KEYBOARD.selected[depth] += 1;
            } else if (selected instanceof Expression) {
                if (KEYBOARD.special_selection === 0) {
                    KEYBOARD.selected.push(0);
                    KEYBOARD.special_selection = 0;
                }
            }
        }
    }
}

KEYS = Array.from(document.getElementById("keyboard").children);
EQUATION = { left: new Expression(), right: new Expression(), active: "left" };

KEYBOARD = {
    "active_expression": "left",
    "selected": [0],
    "special_selection": 0,
    "encoding": "0123456789()^*/+-=".split("").concat(["FRACTION", "SOLVE", "DELETE", "CLEAR", "LEFT", "RIGHT"]),
    "selectedElement": (depth = KEYBOARD.selected.length - 1) => {
        let lowest_parenthesis = EQUATION[EQUATION.active];

        for (let i = 0; i < depth; i++) {
            lowest_parenthesis = lowest_parenthesis.value[KEYBOARD.selected[i]];
        }

        let selected = lowest_parenthesis.value[KEYBOARD.selected[depth]];
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
   
    let _cursor = document.getElementById("cursor");
    _cursor.value = String(KEYBOARD.selected) + " | " + KEYBOARD.special_selection;
})