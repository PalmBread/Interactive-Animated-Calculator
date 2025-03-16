const PMath = {
    gcd(a, b) {
        let x = BigInt(a.value);
        let y = BigInt(b.value);

        while (y !== BigInt(0)) {
            [x, y] = [y, x % y];
        }

        return new Integer(x);
    },

    lcm(a, b) {
        let x = BigInt(a.value);
        let y = BigInt(b.value);
        let value = PMath.gcd(a, b).value;

        return new Integer((x * y) / BigInt(value));
    },
};

class Expression {
    constructor(json = null) {
        this.name = "Expression";

        if (json !== null) {
            let value = JSON.parse(json);
            value = value.map((element) => {
                switch (element.name) {
                    case "Operation":
                        return new Operation(element.type);
                    case "SimpleFraction":
                        return new SimpleFraction(
                            Number(element.numerator.value),
                            Number(element.denominator.value)
                        );
                    case "ComplexFraction":
                        return new ComplexFraction(
                            element.numerator,
                            element.denominator
                        );
                    case "Expression":
                        return new Expression(JSON.stringify(element.value));
                    default:
                        return "Error";
                }
            });

            this.value = value;
        } else {
            this.value = [];
        }
    }

    add = (element, location = []) => this.value.push(element);
    copy = () => new Expression(this.json());
    json = () => JSON.stringify(this.value);

    get(location) {
        let depth = location.length - 1;
        let parent = this;

        if (depth === -1) {
            return this.toString();
        }

        //get to the "lowest" parenthesis
        for (let i = 0; i < depth; i++) {
            parent = parent.value[location[i]];
        }

        return [parent.value[location[depth]], parent, depth];
    }


    toString(toplevel = true) {
        let result = "";
        this.value.forEach((element) => (result += element.toString(false)));

        return toplevel ? result : "(" + result + ")";
    }

    next() {
        let index = this.value.findIndex(
            (element) => element instanceof Expression
        );

        if (index !== -1) {
            let result = [index];
            let expression = this.value[index];
            result = result.concat(expression.next());

            return result;
        }

        ////Exponents (Not Implented)
        //index = this.value.findIndex(element => element instanceof Operation && element.type === 4);
        //if (index !== -1) { return [index]; }

        //Multiplication x Division
        index = this.value.findIndex((element) => element instanceof Operation && element.type >= 2);
        if (index !== -1) {
            return [index];
        }

        //Addition x Subtraction
        index = this.value.findIndex((element) => element instanceof Operation);
        if (index !== -1) {
            return [index];
        }

        //Null Operation (When there is a single term in a parenthesis)
        return [];
    }

    step() {
        let location = this.next();

        let [operation, parent, depth] = this.get(location);

        //Null Operation
        if (operation.name === "Expression") {
            parent.value[location[depth]] = operation.value[0];
            return this.toString();
        }

        let x = parent.value[location[depth] - 1];
        let y = parent.value[location[depth] + 1];

        if (x instanceof SimpleFraction && y instanceof SimpleFraction) {
            let result;

            switch (operation.type) {
                case 0: //Addition
                    result = x.add(y);
                    break;

                case 1: //Subtraction
                    result = x.sub(y);
                    break;

                case 2: //Multiplication
                    result = x.mul(y);
                    break;

                case 3: //Division
                    result = x.div(y);
                    break;

                case 4: //Exponent
                    result = x.exp(y);
                    break;

                default:
                    break;
            }

            parent.value.splice(location[depth] - 1, 2);
            parent.value[location[depth] - 1] = result;
            return this.toString();

        } else {
            parent.value.splice(location[depth] - 1, 2);
            parent.value[location[depth] - 1] = "Error";
            return "Error";
        }
    }
}

class Operation {
    static encoding = ["+", "-", "*", "/", "^"];

    constructor(type, invisible = false) {
        this.name = "Operation";
        this.type = typeof type === "string" ? Operation.encoding.indexOf(type) : type;
        this.invisible = invisible;
        this.length = 1;
    }

    toString = () => this.invisible ? "" : " " + Operation.encoding[this.type] + " ";
}

class Integer {
    constructor(value) {
        this.value = String(value); // Store as a string
    }

    toString = () => this.value;
    toNumber = () => Number(this.value);
    add = (integer) => new Integer(BigInt(this.value) + BigInt(integer.value));
    sub = (integer) => new Integer(BigInt(this.value) - BigInt(integer.value));
    mul = (integer) => new Integer(BigInt(this.value) * BigInt(integer.value));
    div = (integer) => new Integer(BigInt(this.value) / BigInt(integer.value));
    exp = (integer) => new Integer(BigInt(this.value) ** BigInt(integer.value));
    con = (integer) => new Integer(this.value + integer.value);
}

class SimpleFraction {
    constructor(numerator, denominator = 1) {
        this.name = "SimpleFraction";
        this.numerator = new Integer(numerator);
        this.denominator = new Integer(denominator);
        this.length = this.toString(false).length;
    }

    toString = (simplify = true) => {
        let lowest = this;
        if (simplify) { lowest = this.simplify(false); }
        return (Number(lowest.numerator.value) / Number(lowest.denominator.value)).toString();
    }

    simplify(save = true) {
        let a = this.numerator;
        let b = this.denominator;
    
        while(a.value.includes('.') || b.value.includes('.')) {
            a = a.mul(new Integer(10));
            b = b.mul(new Integer(10));
        }

        let gcd = PMath.gcd(a, b);

        a = a.div(new Integer(gcd));
        b = b.div(new Integer(gcd));

        if (save) {
            this.numerator = a;
            this.denominator = b;
            return this;
        } else {
            return new SimpleFraction(a.value, b.value);
        }
    }

    add(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let denominator = PMath.lcm(x.denominator, y.denominator);
        let numerator = x.numerator.mul(denominator.div(x.denominator)).add(y.numerator.mul(denominator.div(y.denominator)));

        return new SimpleFraction(numerator, denominator).simplify(false);
    }

    sub(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let denominator = PMath.lcm(x.denominator, y.denominator);
        let numerator = x.numerator.mul(denominator.div(x.denominator)).sub(y.numerator.mul(denominator.div(y.denominator)));

        return new SimpleFraction(numerator, denominator).simplify(false);
    }

    mul(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.mul(y.numerator);
        let denominator = x.denominator.mul(y.denominator);

        return new SimpleFraction(numerator, denominator).simplify(false);
    }

    div(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        console

        let numerator = x.numerator.mul(y.denominator);
        let denominator = x.denominator.mul(y.numerator);

        return new SimpleFraction(numerator, denominator).simplify(false);
    }

    exp(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.exp(y.numerator).mul(y.denominator.exp(x.denominator));
        let denominator = x.denominator.exp(y.numerator).mul(y.denominator.exp(x.numerator));

        return new SimpleFraction(numerator, denominator).simplify(false);
    }

    con(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.con(y.numerator);

        return new SimpleFraction(numerator, 1).simplify(false);
    }
}

class ComplexFraction {
    constructor(numerator, denominator) {
        this.name = "ComplexFraction";
        this.numerator = new Expression(numerator);
        this.denominator = new Expression(denominator);
    }

    toString = () => `(${this.numerator} / ${this.denominator})`;
}