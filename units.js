const units = {
	volume: {
		base_measurement: "milliliter",
		measurements: {
			milliliter: {
				in_base: 1,
				symbols: ["mL", "ml", "cc"],
				names: ["milliliter", "millilitre", "cubic centimeter"],
				system: "metric"
			},
			liter: {
				in_base: 1000,
				symbols: ["L", "l"],
				names: ["liter", "litre"],
				system: "metric"
			},
			deciliter: {
				in_base: 100,
				symbols: ["dL", "dl"],
				names: ["deciliter", "decilitre"],
				system: "metric"
			},
			teaspoon: {
				in_base: 5,
				symbols: ["tsp", "t"],
				names: ["teaspoon"],
				system: "imperial"
			},
			tablespoon: {
				in_base: 15,
				symbols: ["tbsp", "T"],
				names: ["tablespoon"],
				system: "imperial"
			},
			cup: {
				in_base: 237,
				symbols: ["cup", "c"],
				names: ["cup"],
				system: "imperial"
			},
			pint: {
				in_base: 473,
				symbols: ["p", "pt"],
				names: ["pint"],
				system: "imperial"
			},
			quart: {
				in_base: 946,
				symbols: ["q", "qt", "qrt"],
				names: ["quart"],
				system: "imperial"
			},
			gallon: {
				in_base: 3785,
				symbols: ["gl", "gal"],
				names: ["gallon"],
				system: "imperial"
			}
		}
	},
	weight: {
		base_measurement: "gram",
		measurements: {
			gram: {
				in_base: 1,
				symbols: ["g"],
				names: ["gram", "gramme"],
				system: "metric"
			},
			milligram: {
				in_base: 0.001,
				symbols: ["mg"],
				names: ["milligram", "milligramme"],
				system: "metric"
			},
			kilogram: {
				in_base: 0.001,
				symbols: ["kg"],
				names: ["kilogram", "kilogramme", "kilo"],
				system: "metric"
			},
			pound: {
				in_base: 454,
				symbols: ["lb"],
				names: ["pound"],
				system: "imperial"
			},
			ounce: {
				in_base: 28,
				symbols: ["oz"],
				names: ["ounce"],
				system: "imperial"
			}
		}
	}
};

const createList = arr => {
	if (arr.length == 1) return arr[0];
	const new_arr = arr.slice().map((x, i) => (i == (arr.length - 1)) ? ("and " + x) : x);
	if (new_arr.length == 2) return new_arr.join(" ");
	return new_arr.join(", ");
};

const getInAllOtherUnits = (amount, unit, category) => {
	const categories = Object.keys(units);
	if (!categories.includes(category)) throw `That's not a valid category of units. Please choose between ${createList(categories)}`;

	const { base_measurement, measurements } = units[category];
	const measurementsEntries = Object.entries(measurements);
	const applicable_measurements = measurementsEntries
		.filter(([name, {symbols, names}]) => [...symbols, ...names, name].includes(unit))
		.map(([name, { in_base }]) => in_base);

	if (applicable_measurements.length == 0) throw `A unit named "${unit}" wasn't found in the category named "${category}"`;
	if (applicable_measurements.length > 1) throw `Too many units named "${unit}" were found in the category named "${category}"`;
	if (typeof amount != "number") throw `Inputted amount must be of type "number"`;

	let output = {};
	const amount_in_base_unit = amount / applicable_measurements[0];
	for (const [name, {symbols, names, in_base, system}] of measurementsEntries) {
		output[name] = {
			amount: amount_in_base_unit / in_base,
			symbols,
			names,
			system
		};
	}
	return output;
};

const assumeCategory = unit => {
	const search_for = unit.endsWith("s") ? [unit, unit.slice(0, -1)] : [unit];
	let possible_categories = [];
	Object.entries(units).forEach(([category, {measurements}]) => {
		const possible_names = Object.entries(measurements).flatMap(([name, {symbols, names}]) => [name, ...names, ...symbols]);
		if (search_for.some(x => possible_names.includes(x))) possible_categories.push(category);
	});
	return [...(new Set(possible_categories))];
};

const getLogDistance = x => Math.abs(Math.log10(x));

const findGCD = (a, b) => {
	if (!b) return a;
	return findGCD(b, a % b);
};

const convertToFraction = decimal => {
	const power = Math.pow(10, decimal.toString().split(".")[1].length);
	const new_numerator = decimal * power;
	const gcd = findGCD(new_numerator, power);
	return `${new_numerator / gcd}/${power / gcd}`
};

const convertToSensibleUnits = ({amount, unit, category = "", use_symbol = false, system = "imperial"}) => {
	const possible_categories = assumeCategory(unit);
	if (
		!category
		|| !Object.keys(units).includes(category)
		|| !possible_categories.includes(category)
	) {
		if (possible_categories.length == 0) throw "No categories match that unit";
		if (possible_categories.length > 1) throw "More than one category matches that unit, so please be more specific";
		category = possible_categories[0];
	}

	const in_other_units = Object.entries(
		getInAllOtherUnits(amount, unit, category)
	)
		.map(([name, {amount, symbols, system}]) => ({
			amount,
			unit: use_symbol ? symbols[0] : name,
			system
		}))
		.filter(x => x.system == system);

	const only_integer_amounts = in_other_units.filter(x => parseInt(x.amount) == x.amount);
	if (only_integer_amounts.length) {
		only_integer_amounts.sort((x, y) => x.amount - y.amount);
		return only_integer_amounts[0];
	} else {
		const with_fractions = in_other_units.map(x => ({...x, amount: convertToFraction(x.amount)}));
		with_fractions.sort((x, y) => x.amount.length - y.amount.length);
		return with_fractions[0];
	}
};
