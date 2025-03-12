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
        index = this.value.findIndex(
            (element) => element instanceof Operation && element.type >= 2
        );
        if (index !== -1) {
            return [index];
        }

        //Addition x Subtraction
        index = this.value.findIndex((element) => element instanceof Operation);
        if (index !== -1) {
            return [index];
        }

        //Null Operation (When there is a single term in a parenthesis)
        if (this.value.length === 1) {
            return [];
        }
    }

    step() {
        let location = this.next();

        if (location.length === 0) {
            return this.toString();
        }

        let [operation, parent, depth] = this.get(location);

        //Null Operation
        if (operation.name === "Expression") {
            parent.value[location[depth]] = operation.value[0];
            return this.toString();
        }

        let x = parent.value[location[depth] - 1];
        let y = parent.value[location[depth] + 1];

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

            case 4: //Exponent (Not Implmented)
                break;
                result = x.exp(y);

            default:
                break;
        }

        parent.value.splice(location[depth] - 1, 2);
        parent.value[location[depth] - 1] = new SimpleFraction(result);

        return this.toString();
    }
}

class Integer {
    constructor(value) {
        this.value = BigInt(value).toString(); // Store as a string
    }

    toString = () => this.value;
    toNumber = () => Number(this.value);
    add = (integer) => new Integer(BigInt(this.value) + BigInt(integer.value));
    sub = (integer) => new Integer(BigInt(this.value) - BigInt(integer.value));
    mul = (integer) => new Integer(BigInt(this.value) * BigInt(integer.value));
    div = (integer) => new Integer(BigInt(this.value) / BigInt(integer.value));
    exp = (integer) => new Integer(BigInt(this.value) ** BigInt(integer.value));
}

class Operation {
    static encoding = ["+", "-", "*", "/", "^"];

    constructor(type, invisible = false) {
        this.name = "Operation";
        this.type = typeof type === "string" ? Operation.encoding.indexOf(type) : type;
        this.invisible = invisible;
    }

    toString = () => this.invisible ? "" : " " + Operation.encoding[this.type] + " ";
}

class SimpleFraction {
    constructor(numerator, denominator = 1) {
        this.name = "SimpleFraction";

        this.numerator = new Integer(numerator);
        this.denominator = new Integer(denominator);

        this.length = this.toString().length;
    }

    toString = () => this.numerator.div(this.denominator).toString();

    add(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let denominator = PMath.lcm(x.denominator, y.denominator);
        let numerator = x.numerator.mul(denominator.div(x.denominator)).add(y.numerator.mul(denominator.div(y.denominator)));

        return new SimpleFraction(numerator, denominator);
    }

    sub(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let denominator = PMath.lcm(x.denominator, y.denominator);
        let numerator = x.numerator.mul(denominator.div(x.denominator)).sub(y.numerator.mul(denominator.div(y.denominator)));

        return new SimpleFraction(numerator, denominator);
    }

    mul(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.mul(y.numerator);
        let denominator = x.denominator.mul(y.denominator);

        return new SimpleFraction(numerator, denominator).simplify();
    }

    div(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.mul(y.denominator);
        let denominator = x.denominator.mul(y.numerator);

        return new SimpleFraction(numerator, denominator).simplify();
    }

    exp(fraction) {
        let x = this.simplify(false);
        let y = fraction.simplify(false);

        let numerator = x.numerator.exp(y.numerator).mul(y.denominator.exp(x.denominator));
        let denominator = x.denominator.exp(y.numerator).mul(y.denominator.exp(x.numerator));

        return new SimpleFraction(numerator, denominator).simplify();
    }

    simplify(save = true) {
        while (
            !Number.isInteger(this.numerator.toNumber()) || 
            !Number.isInteger(this.denominator.toNumber())
        ) {
            this.numerator = this.numerator.mul(new Integer(10));
            this.denominator = this.denominator.mul(new Integer(10));
        }

        let gcd = PMath.gcd(this.numerator, this.denominator);

        if (save) {
            this.numerator = this.numerator.div(new Integer(gcd));
            this.denominator = this.denominator.div(new Integer(gcd));
            return this;
        }

        let result = new SimpleFraction(
            new Integer(this.numerator.div(new Integer(gcd))),
            new Integer(this.denominator.div(new Integer(gcd)))
        );

        return result;
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
