import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';

const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const inputIds = {
    density: 'de', volume: 'vo', mass: 'ma', maxheight: 'mh',
    distance: 'di', height: 'h', velocity: 've', time: 't', acceleration: 'a', potential: 'p', kinetical: 'k'
};
const outputIds = ['potential', 'kinetical', 'mechanical', 'force', 'work'];

function createCalculator(values = {}) {
    const bodyListeners = new Map();
    const elements = Object.fromEntries([...Object.keys(inputIds), ...outputIds, 'mode'].map(id => [id, {
        value: '', tagName: 'INPUT', type: 'text', style: {}, attributes: {},
        setAttribute(name, value) { this.attributes[name] = String(value); },
        getAttribute(name) { return this.attributes[name] ?? null; },
        innerHTML: id === 'mode' ? 'Light' : '', validationMessage: '', reportedValidation: '', listeners: new Map(),
        addEventListener(event, listener) { this.listeners.set(event, listener); },
        setCustomValidity(message) { this.validationMessage = message; },
        reportValidity() { this.reportedValidation = this.validationMessage; return this.validationMessage === ''; }
    }]));
    const context = createContext({
        document: {
            body: {
                style: {}, attributes: { 'data-theme': 'dark' },
                addEventListener(event, listener) { bodyListeners.set(event, listener); },
                setAttribute(name, value) { this.attributes[name] = String(value); },
                getAttribute(name) { return this.attributes[name] ?? null; }
            },
            getElementById(id) { return elements[id]; },
            querySelectorAll() { return []; }
        }
    });
    runInContext(source, context);
    for (const [id, value] of Object.entries(values)) elements[id].value = String(value);
    return {
        elements,
        body: context.document.body,
        clickMode() { elements.mode.listeners.get('click')?.(); },
        calculate() { runInContext('energies(); works();', context); },
        blur(id) { elements[id].listeners.get('blur')?.(); },
        edit(id, value) {
            elements[id].value = String(value);
            runInContext(`input('${inputIds[id]}')`, context);
            bodyListeners.get('input')?.({ target: elements[id] });
        }
    };
}

for (const fixture of [
    { name: 'mechanical energy adds numeric energies', inputs: { mass: 2, height: 1, velocity: 2 }, output: 'mechanical', expected: '24' },
    { name: 'mechanical energy preserves a negative total', inputs: { mass: 2, height: -1, velocity: 2 }, output: 'mechanical', expected: '-16' },
    { name: 'work uses unformatted force', inputs: { mass: 1500, acceleration: 1, distance: 2 }, output: 'work', expected: '3,000' },
    { name: 'mechanical energy uses unrounded energies', inputs: { mass: 2, height: 0.00002, velocity: 0.02 }, output: 'mechanical', expected: '0.001' },
    { name: 'work uses unrounded force', inputs: { mass: 1, acceleration: 0.0004, distance: 10000 }, output: 'work', expected: '4' },
    { name: 'missing mass leaves potential energy unavailable', inputs: { height: 1 }, output: 'potential', expected: '' },
    { name: 'explicit zero mass produces zero potential energy', inputs: { mass: 0, height: 1 }, output: 'potential', expected: '0' },
    { name: 'mechanical energy needs both component energies', inputs: { mass: 2, height: 1 }, output: 'mechanical', expected: '' },
    { name: 'overflow never reaches potential output', inputs: { mass: '1e308', height: 10 }, output: 'potential', expected: '' },
    { name: 'overflow never reaches kinetic output', inputs: { mass: 1, velocity: '1e308' }, output: 'kinetical', expected: '' },
    { name: 'overflow never reaches force output', inputs: { mass: '1e308', acceleration: 10 }, output: 'force', expected: '' },
    { name: 'overflow never reaches work output', inputs: { mass: 1, acceleration: '1e308', distance: 10 }, output: 'work', expected: '' },
    { name: 'overflow never reaches mechanical output', inputs: { mass: '1e307', height: 1, velocity: 5 }, output: 'mechanical', expected: '' }
]) {
    test(fixture.name, () => {
        const calculator = createCalculator(fixture.inputs);
        calculator.calculate();
        assert.equal(calculator.elements[fixture.output].value, fixture.expected);
    });
}

test('derived mass stays numeric above one thousand', () => {
    const calculator = createCalculator({ volume: 1, height: 1 });
    calculator.edit('density', 1500);
    assert.equal(calculator.elements.mass.value, '1500');
    assert.equal(calculator.elements.potential.value, '15000');
});

test('derived values preserve full precision', () => {
    const calculator = createCalculator({ density: 1, height: 10000 });
    calculator.edit('volume', 0.0004);
    assert.equal(calculator.elements.mass.value, '0.0004');
    assert.equal(calculator.elements.potential.value, '40');
});

test('decimal inputs are not stripped after recalculation', () => {
    const calculator = createCalculator({ height: 1 });
    calculator.edit('mass', '0.5');
    assert.equal(calculator.elements.mass.value, '0.5');
    assert.equal(calculator.elements.potential.value, '5');
});

for (const value of ['1.2.3', '12abc', '0x10', 'Infinity', 'NaN', '1e309', '-1']) {
    test(`invalid mass ${value} clears dependent results without rewriting input`, () => {
        const calculator = createCalculator({ mass: 2, height: 1, velocity: 2, acceleration: 1, distance: 2 });
        calculator.calculate();
        calculator.edit('mass', value);
        assert.equal(calculator.elements.mass.value, value);
        assert.notEqual(calculator.elements.mass.validationMessage, '');
        for (const id of outputIds) assert.equal(calculator.elements[id].value, '');
    });
}

test('correcting invalid input removes its validation error', () => {
    const calculator = createCalculator({ height: 1 });
    calculator.edit('mass', 'abc');
    calculator.edit('mass', '2');
    assert.equal(calculator.elements.mass.validationMessage, '');
    assert.equal(calculator.elements.potential.value, '20');
});

test('clearing input clears its stale results', () => {
    const calculator = createCalculator({ mass: 2, height: 1, velocity: 2 });
    calculator.calculate();
    calculator.edit('height', '');
    assert.equal(calculator.elements.potential.value, '');
    assert.equal(calculator.elements.mechanical.value, '');
    assert.equal(calculator.elements.kinetical.value, '4');
});

for (const value of ['', '0', '-1', 'abc']) {
    test(`unavailable time ${JSON.stringify(value)} clears acceleration but preserves kinetic energy`, () => {
        const calculator = createCalculator({ mass: 2, velocity: 2, acceleration: 3, distance: 2 });
        calculator.edit('time', value);
        assert.equal(calculator.elements.acceleration.value, '');
        assert.equal(calculator.elements.force.value, '');
        assert.equal(calculator.elements.work.value, '');
        assert.equal(calculator.elements.kinetical.value, '4');
        if (value !== '') assert.notEqual(calculator.elements.time.validationMessage, '');
    });
}

test('time derives acceleration from signed velocity', () => {
    const calculator = createCalculator({ mass: 2, velocity: -4, distance: 3 });
    calculator.edit('time', 2);
    assert.equal(calculator.elements.acceleration.value, '-2');
    assert.equal(calculator.elements.force.value, '-4');
    assert.equal(calculator.elements.work.value, '-12');
    assert.equal(calculator.elements.kinetical.value, '16');
});

test('direct height preserves distance used for work', () => {
    const calculator = createCalculator({ mass: 2, acceleration: 3, distance: 4, maxheight: 10 });
    calculator.edit('height', 5);
    assert.equal(calculator.elements.maxheight.value, '');
    assert.equal(calculator.elements.distance.value, '4');
    assert.equal(calculator.elements.work.value, '24');
});

test('distance does not overwrite direct height', () => {
    const calculator = createCalculator({ mass: 2, acceleration: 3 });
    calculator.edit('height', 5);
    calculator.edit('distance', 4);
    assert.equal(calculator.elements.height.value, '5');
    assert.equal(calculator.elements.potential.value, '100');
});

test('direct acceleration preserves velocity used for kinetic energy', () => {
    const calculator = createCalculator({ mass: 2, velocity: 4, time: 2 });
    calculator.edit('acceleration', 3);
    assert.equal(calculator.elements.time.value, '');
    assert.equal(calculator.elements.velocity.value, '4');
    assert.equal(calculator.elements.kinetical.value, '16');
});

test('velocity does not overwrite direct acceleration', () => {
    const calculator = createCalculator({ mass: 2 });
    calculator.edit('acceleration', 3);
    calculator.edit('velocity', 4);
    assert.equal(calculator.elements.acceleration.value, '3');
    assert.equal(calculator.elements.force.value, '6');
});

test('editing distance updates an active derived height', () => {
    const calculator = createCalculator({ mass: 2, distance: 1 });
    calculator.edit('maxheight', 10);
    calculator.edit('distance', 4);
    assert.equal(calculator.elements.height.value, '6');
    assert.equal(calculator.elements.potential.value, '120');
});

test('clearing maximum height clears active derived height', () => {
    const calculator = createCalculator({ mass: 2, distance: 1 });
    calculator.edit('maxheight', 10);
    calculator.edit('maxheight', '');
    assert.equal(calculator.elements.height.value, '');
    assert.equal(calculator.elements.potential.value, '');
});

test('editing velocity updates active derived acceleration', () => {
    const calculator = createCalculator({ mass: 2, velocity: 4 });
    calculator.edit('time', 2);
    calculator.edit('velocity', 6);
    assert.equal(calculator.elements.acceleration.value, '3');
    assert.equal(calculator.elements.force.value, '6');
});

test('incomplete mass derivation clears stale mass', () => {
    const calculator = createCalculator({ mass: 2, height: 1 });
    calculator.edit('density', 3);
    assert.equal(calculator.elements.mass.value, '');
    assert.equal(calculator.elements.potential.value, '');
});

test('direct mass clears alternate source inputs and their validation', () => {
    const calculator = createCalculator({ height: 1 });
    calculator.edit('density', 'abc');
    calculator.edit('mass', 2);
    assert.equal(calculator.elements.density.value, '');
    assert.equal(calculator.elements.volume.value, '');
    assert.equal(calculator.elements.density.validationMessage, '');
    assert.equal(calculator.elements.potential.value, '20');
});

for (const id of ['density', 'volume', 'distance']) {
    test(`negative ${id} is invalid without discarding independent inputs`, () => {
        const calculator = createCalculator({ mass: 2, height: 1, acceleration: 3 });
        calculator.edit(id, '-1');
        assert.notEqual(calculator.elements[id].validationMessage, '');
        if (id === 'distance') {
            assert.equal(calculator.elements.potential.value, '20');
            assert.equal(calculator.elements.force.value, '6');
            assert.equal(calculator.elements.work.value, '');
        }
    });
}

test('invalid numeric input reports its validation error on blur', () => {
    const calculator = createCalculator({ height: 1 });
    calculator.edit('mass', 'abc');
    calculator.blur('mass');
    assert.notEqual(calculator.elements.mass.reportedValidation, '');
});

test('manual energies calculate mechanical energy without mass', () => {
    const calculator = createCalculator();
    calculator.edit('potential', '1500.5');
    calculator.edit('kinetical', '20.25');
    assert.equal(calculator.elements.potential.value, '1500.5');
    assert.equal(calculator.elements.kinetical.value, '20.25');
    assert.equal(calculator.elements.mechanical.value, '1,520.75');
});

test('manual potential clears height sources but preserves work and kinetic inputs', () => {
    const calculator = createCalculator({ mass: 2, height: 5, maxheight: 9, distance: 4, acceleration: 3, velocity: 4 });
    calculator.edit('potential', '50');
    assert.equal(calculator.elements.height.value, '');
    assert.equal(calculator.elements.maxheight.value, '');
    assert.equal(calculator.elements.mass.value, '2');
    assert.equal(calculator.elements.distance.value, '4');
    assert.equal(calculator.elements.kinetical.value, '16');
    assert.equal(calculator.elements.mechanical.value, '66');
    assert.equal(calculator.elements.work.value, '24');
});

test('manual kinetic clears velocity sources but preserves acceleration and potential inputs', () => {
    const calculator = createCalculator({ mass: 2, height: 5, velocity: 4, time: 2, acceleration: 3, distance: 4 });
    calculator.edit('kinetical', '16');
    assert.equal(calculator.elements.velocity.value, '');
    assert.equal(calculator.elements.time.value, '');
    assert.equal(calculator.elements.acceleration.value, '3');
    assert.equal(calculator.elements.potential.value, '100');
    assert.equal(calculator.elements.mechanical.value, '116');
    assert.equal(calculator.elements.work.value, '24');
});

for (const [id, expected] of [['mass', ''], ['density', ''], ['volume', ''], ['height', '60'], ['maxheight', '40']]) {
    test(`editing ${id} cancels manual potential energy`, () => {
        const calculator = createCalculator({ mass: 2, height: 5, distance: 1 });
        calculator.edit('potential', '50');
        calculator.edit(id, '3');
        assert.equal(calculator.elements.potential.value, expected);
    });
}

for (const id of ['mass', 'density', 'volume', 'velocity', 'time']) {
    test(`editing ${id} cancels manual kinetic energy`, () => {
        const calculator = createCalculator({ mass: 2, velocity: 4 });
        calculator.edit('kinetical', '50');
        calculator.edit(id, '3');
        assert.equal(calculator.elements.kinetical.value, id === 'velocity' ? '9' : '');
    });
}

test('unrelated edits preserve both manual energies', () => {
    const calculator = createCalculator({ mass: 2 });
    calculator.edit('potential', '50');
    calculator.edit('kinetical', '16');
    calculator.edit('acceleration', '3');
    calculator.edit('distance', '4');
    assert.equal(calculator.elements.potential.value, '50');
    assert.equal(calculator.elements.kinetical.value, '16');
    assert.equal(calculator.elements.mechanical.value, '66');
    assert.equal(calculator.elements.work.value, '24');
});

test('clearing manual energy clears mechanical energy', () => {
    const calculator = createCalculator();
    calculator.edit('potential', '50');
    calculator.edit('kinetical', '16');
    calculator.edit('potential', '');
    assert.equal(calculator.elements.mechanical.value, '');
    assert.equal(calculator.elements.kinetical.value, '16');
});

test('invalid manual energy is preserved with validation and no mechanical result', () => {
    const calculator = createCalculator();
    calculator.edit('kinetical', '16');
    calculator.edit('potential', '1.2.3');
    assert.equal(calculator.elements.potential.value, '1.2.3');
    assert.notEqual(calculator.elements.potential.validationMessage, '');
    assert.equal(calculator.elements.mechanical.value, '');
});

test('negative kinetic energy is rejected', () => {
    const calculator = createCalculator();
    calculator.edit('potential', '50');
    calculator.edit('kinetical', '-1');
    assert.notEqual(calculator.elements.kinetical.validationMessage, '');
    assert.equal(calculator.elements.mechanical.value, '');
});

test('negative manual potential and zero kinetic energy are valid', () => {
    const calculator = createCalculator();
    calculator.edit('potential', '-20');
    calculator.edit('kinetical', '0');
    assert.equal(calculator.elements.mechanical.value, '-20');
});

test('editable computed energies retain precision', () => {
    const calculator = createCalculator({ mass: 2, height: 0.00002, velocity: 0.02 });
    calculator.calculate();
    assert.equal(calculator.elements.potential.value, '0.0004');
    assert.equal(calculator.elements.kinetical.value, '0.0004');
});

test('theme button switches from dark to light and back without text coupling', () => {
    const calculator = createCalculator();
    calculator.clickMode();
    assert.equal(calculator.body.getAttribute('data-theme'), 'light');
    assert.equal(calculator.elements.mode.getAttribute('aria-label'), 'Switch to dark mode');
    calculator.clickMode();
    assert.equal(calculator.body.getAttribute('data-theme'), 'dark');
    assert.equal(calculator.elements.mode.getAttribute('aria-label'), 'Switch to light mode');
});

test('derived overflow clears mass rather than displaying infinity', () => {
    const calculator = createCalculator({ volume: 10, height: 1 });
    calculator.edit('density', '1e308');
    assert.equal(calculator.elements.mass.value, '');
    assert.equal(calculator.elements.potential.value, '');
});
