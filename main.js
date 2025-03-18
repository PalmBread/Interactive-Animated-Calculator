document.querySelectorAll("button").forEach(button => {
    button.setAttribute("tabindex", "-1");
});

function fixExpression(expression) {
    if (expression && expression.name === "Expression" && Array.isArray(expression.value)) {
        for (let i = 0; i < expression.value.length; i++) {
            if (expression.value[i] && expression.value[i].name === "Expression") {
                fixExpression(expression.value[i]);
            }
        }
        
        for (let i = 0; i < expression.value.length - 1;) {
            let current = expression.value[i];
            let next = expression.value[i + 1];
            if (current && next && current.name === "SimpleFraction" && next.name === "SimpleFraction") {
                expression.value.splice(i, 2, current.con(next));
            } else {
                i++;
            }
        }
    }
}


HANDLER = {
    "animate": (element, result) => {
        if (element.getAttribute("data-name") === "Expression") {

            const wrapper = document.createElement("span");
            wrapper.classList.add("operationAnimation");

            element.parentNode.insertBefore(wrapper, element);

            wrapper.textContent = element.textContent;
            let finalWidth = Math.floor(wrapper.offsetWidth * 1.05);
            wrapper.innerHTML = "";

            wrapper.appendChild(element);

            wrapper.style.width = Math.floor(wrapper.offsetWidth * 1.05) + "px";

            setTimeout(() => {
                wrapper.textContent = element.textContent;
                wrapper.style.width = finalWidth + "px";
            }, 400);
            return;
        }
        
        const prev = element.previousElementSibling;
        const next = element.nextElementSibling;
        if (!prev || !next) {
            if (element.parentNode.childElementCount !== 1) {
                console.warn("Element does not have two adjacent siblings to wrap.");
                return;
            }
        }

        const wrapper = document.createElement("span");
        prev.parentNode.insertBefore(wrapper, prev);

        wrapper.textContent = result.toString(false);
        let finalWidth = Math.floor(wrapper.offsetWidth * 1.05);
        wrapper.innerHTML = "";

        wrapper.classList.add("operationAnimation");

        wrapper.appendChild(prev);
        wrapper.appendChild(element);
        wrapper.appendChild(next);

        wrapper.style.height = Math.floor(wrapper.offsetHeight * 1.05) + "px";
        wrapper.style.width = Math.floor(wrapper.offsetWidth * 1.05) + "px";

        setTimeout(() => {
            wrapper.style.width = finalWidth + "px";
            wrapper.textContent = result.toString(false);
        }, 400);      
    },
    "find": (parent, location) => {
        let current = parent;
        for (let i = 0; i < location.length; i++) {
            let index = location[i];
            if (current.children && current.children[index] !== undefined) {
                current = current.children[index];
            } else {
                return null;
            }
        }
        return current;
    },
    "cursor": {
        "hide": () => {
            if (!document.getElementById("hide-cursor-style")) {
                const style = document.createElement("style");
                style.id = "hide-cursor-style";
                style.innerHTML = `* { cursor: none !important; }`;
                document.head.appendChild(style);
            }
        },
        "show": () => { document.getElementById("hide-cursor-style")?.remove(); },
    },
    "display": (expression = EXPRESSION, NoSelect = false) => {
        const input = document.getElementById("input");
        input.innerHTML = "";

        if (expression === "Error") {
            input.textContent = "Error";
            return;
        }

        let selected, lowest_parenthesis;
        if (!NoSelect) {
            ({ lowest_parenthesis, selected } = KEYBOARD.selectedElement());
        }

        function createSpan(element) {
            const span = document.createElement("span");
            span.setAttribute("data-name", element.name);

            if (!NoSelect) {
                if (element === selected) {
                    span.setAttribute("Selected", "");
                } else if (selected === undefined && element === lowest_parenthesis) {
                    span.setAttribute("InSelected", "");
                }
            }

            if (element instanceof SimpleFraction || element instanceof Operation) {
                span.textContent = element.toString();
            } else if (element instanceof Expression) {
                element.value.forEach(child => {
                    span.appendChild(createSpan(child));
                });
            }
            return span;
        }

        expression.value.forEach(element => {
            input.appendChild(createSpan(element));
        });
    },
    "press": {
        "Error": (data) => {
            let { key } = data;
            console.error("\"" + key + "\" is not a valid key.");
        },
        "SimpleFraction": (data) => {
            let { key, lowest_parenthesis, depth } = data;
            if (KEYBOARD.selectedElement().selected !== undefined && KEYBOARD.selectedElement().selected.name === "Expression") {
                KEYBOARD.press(13); // Simulate pressing Operation [Multiplication]
            }
            lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new SimpleFraction(key));
            KEYBOARD.selected[depth] += 1;
        },
        "Expression": (data) => {
            let { key, type, lowest_parenthesis, depth, selected } = data;
            // Parenthesis Open
            if (type === 10) {
                if (selected instanceof Operation || selected === undefined) {
                    lowest_parenthesis.value.splice(KEYBOARD.selected[depth] + 1, 0, new Expression());
                    KEYBOARD.selected[depth] += 1;
                    KEYBOARD.selected.push(0);
                } else if (selected instanceof SimpleFraction || selected instanceof Expression) {
                    KEYBOARD.press(13); // Operation [Multiplication]
                    KEYBOARD.press(10); // Expression [Open Parenthesis]
                }
            }
            // Parenthesis Close
            else if (type === 11) {
                if (depth !== 0) {
                    KEYBOARD.selected.pop();
                }
            }
        },
        "Operation": (data) => {
            let { key, lowest_parenthesis, depth } = data;
            lowest_parenthesis.value.splice(KEYBOARD.selected[depth], 0, new Operation(key));
            KEYBOARD.selected[depth] += 1;
        },
        "ComplexFraction": (data) => {

        },
        "Solve": (data) => {
            setTimeout(() => {
                document.querySelector(".computer").classList.add("display");
                
                //HANDLER.cursor.hide();
                
                const parent = document.getElementById("input");
                let expression = EXPRESSION.copy();
                fixExpression(expression);
    
                HANDLER.display(expression, true);


                let id = setInterval(() => {
                    HANDLER.display(expression, true);

                    let next = expression.next();
                    
                    if (next.length === 0) {
                        document.querySelector(".computer.display").classList.remove("display");
                        clearInterval(id);
                        HANDLER.press.Clear();
                        return;
                    }
                    
                    next = HANDLER.find(parent, next);
                    
                    let result = expression.step(true);

                    if (result === "Error") {
                        document.querySelector(".computer.display").classList.remove("display");
                        clearInterval(id);
                        HANDLER.press.Clear();
                        HANDLER.display("Error", true);
                        return;
                    }

                    HANDLER.animate(next, result);

                    expression.step();

                }, 1500);
            });
        },
        "Delete": (data) => {
            let { lowest_parenthesis, depth } = data;
            if (String(KEYBOARD.selected) === "0") return;
            if (KEYBOARD.selectedElement().selected === undefined && depth !== 0) {
                KEYBOARD.selected.pop();
                KEYBOARD.selectedElement().lowest_parenthesis.value.splice(KEYBOARD.selected[depth - 1] - 1, 1);
                KEYBOARD.selected[depth - 1] -= 1;
            } else if (KEYBOARD.selectedElement().selected.name === "Expression") {
                let length = KEYBOARD.selectedElement().selected.value.length;
                KEYBOARD.selected.push(length);
            } else {
                lowest_parenthesis.value.splice(KEYBOARD.selected[depth] - 1, 1);
                KEYBOARD.selected[depth] -= 1;
            }
        },
        "Clear": (data) => {
            EXPRESSION.value = [];
            KEYBOARD.selected = [0];
        },
        "Left": (data) => {
            let { lowest_parenthesis, depth } = data;
            if (KEYBOARD.selectedElement().selected !== undefined &&
                KEYBOARD.selectedElement().selected.name === "Expression") {
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
            let { lowest_parenthesis, depth } = data;
            KEYBOARD.selected[depth] += 1;
            if (depth !== 0 && KEYBOARD.selected[depth] >= lowest_parenthesis.value.length) {
                KEYBOARD.selected.pop();
            } else if (KEYBOARD.selectedElement().selected === undefined) {
                KEYBOARD.selected[depth] -= 1;
            } else if (KEYBOARD.selectedElement().selected.name === "Expression") {
                KEYBOARD.selected.push(0);
            }
        }
    }
};

KEYS = Array.from(document.querySelectorAll("div.main button"));
EXPRESSION = new Expression();

KEYBOARD = {
    "selected": [0],
    "encoding": "0123456789()^*/+-=".split("").concat(["FRACTION", "SOLVE", "DELETE", "CLEAR", "LEFT", "RIGHT"]),
    "selectedElement": (depth = KEYBOARD.selected.length - 1) => {
        let lowest_parenthesis = EXPRESSION;
        
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
        } else {
            key = event.srcElement.dataset.value;
            type = KEYBOARD.encoding.findIndex(element => element === key);
        }

        let { lowest_parenthesis, depth, selected } = KEYBOARD.selectedElement();

        if (selected instanceof Operation && selected.invisible) {
            KEYBOARD.press(20); // Delete
            KEYBOARD.press(key); // Expression
            return;
        }

        let data = { key, type, lowest_parenthesis, depth, selected, parameters };
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
        HANDLER.display();
    }
};

KEYS.forEach(button => button.addEventListener("click", KEYBOARD.press));

addEventListener("keydown", event => {
    let buttons = KEYS.filter(element => element.dataset.keycode === event.key);
    buttons.forEach(btn => {
        btn.click();
        btn.classList.add("pressed");
    });
});

addEventListener("keyup", () => {
    let buttons = document.querySelectorAll("button.pressed");
    buttons.forEach(button => button.classList.remove("pressed"));
});
