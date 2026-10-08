function linktblank(link){
    window.open(link);
}

function linktself(link){
    location.href = link;
}

// Variable Declarations :

// Mass section :
const density = document.getElementById('density'); //de
const volume = document.getElementById('volume'); //vo
const mass = document.getElementById('mass'); //ma


// Height section :
const maxHeight = document.getElementById('maxheight'); //mh
const distance = document.getElementById('distance'); //di
const height = document.getElementById('height'); //h


// Acceleration section :
const velocity = document.getElementById('velocity'); //ve
const time = document.getElementById('time'); //t
const acceleration = document.getElementById('acceleration'); //a

// energies section :
const potential = document.getElementById('potential'); //p
const kinetical = document.getElementById('kinetical'); //k
const mechanical = document.getElementById('mechanical'); //me

// Work section :
const force = document.getElementById('force'); //f
const work = document.getElementById('work'); //w

// Universal constant :
const g = 10;


// Main functions :

// function confirmationMessage(){
//     return "Do you want to leave this site?";
// }

function readNumber(field){
    const value = field.value.trim();
    field.setCustomValidity('');
    if(value === '') return null;

    const number = Number(value);
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) || !Number.isFinite(number)){
        field.setCustomValidity('Enter a finite decimal number.');
        return null;
    }
    if(field === time && number <= 0){
        field.setCustomValidity('Time must be greater than zero.');
        return null;
    }
    if([density, volume, mass, distance, kinetical].includes(field) && number < 0){
        field.setCustomValidity('Enter zero or a positive number.');
        return null;
    }
    return number;
}

[density, volume, mass, maxHeight, distance, height, velocity, time, acceleration, potential, kinetical].forEach(field => {
    field.addEventListener('blur', () => {
        readNumber(field);
        field.reportValidity();
    });
});

function setDerivedValue(field, value){
    field.value = value !== null && Number.isFinite(value) ? String(value) : '';
    field.setCustomValidity('');
}

let manualPotential = false;
let manualKinetic = false;

function energies(){
    const massValue = readNumber(mass);
    const heightValue = readNumber(height);
    const velocityValue = readNumber(velocity);
    const potentialValue = manualPotential ? readNumber(potential) : massValue !== null && heightValue !== null ? massValue * g * heightValue : null;
    const kineticValue = manualKinetic ? readNumber(kinetical) : massValue !== null && velocityValue !== null ? 0.5 * massValue * Math.pow(velocityValue, 2) : null;
    const mechanicalValue = potentialValue !== null && kineticValue !== null ? potentialValue + kineticValue : null;

    if(!manualPotential) setDerivedValue(potential, potentialValue);
    if(!manualKinetic) setDerivedValue(kinetical, kineticValue);
    mechanical.value = formatNumber(mechanicalValue);
}

function works(){
    const massValue = readNumber(mass);
    const accelerationValue = readNumber(acceleration);
    const distanceValue = readNumber(distance);
    const forceValue = massValue !== null && accelerationValue !== null ? massValue * accelerationValue : null;
    const workValue = forceValue !== null && distanceValue !== null ? forceValue * distanceValue : null;

    force.value = formatNumber(forceValue);
    work.value = formatNumber(workValue);
}

function input(id){
    if(['de', 'vo', 'ma', 'mh', 'h'].includes(id) || (id === 'di' && maxHeight.value.trim() !== '')) manualPotential = false;
    if(['de', 'vo', 'ma', 've', 't'].includes(id)) manualKinetic = false;

    if(id === 'p'){
        manualPotential = true;
        setDerivedValue(height, null);
        setDerivedValue(maxHeight, null);
    } else if(id === 'k'){
        manualKinetic = true;
        setDerivedValue(velocity, null);
        setDerivedValue(time, null);
    } else if(id === 'de' || id === 'vo'){
        const densityValue = readNumber(density);
        const volumeValue = readNumber(volume);
        setDerivedValue(mass, densityValue !== null && volumeValue !== null ? densityValue * volumeValue : null);
    } else if(id === 'ma'){
        setDerivedValue(density, null);
        setDerivedValue(volume, null);
    } else if(id === 'mh' || (id === 'di' && maxHeight.value.trim() !== '')){
        const maxHeightValue = readNumber(maxHeight);
        const distanceValue = readNumber(distance);
        setDerivedValue(height, maxHeightValue !== null && distanceValue !== null ? maxHeightValue - distanceValue : null);
    } else if(id === 'h'){
        setDerivedValue(maxHeight, null);
    } else if(id === 't' || (id === 've' && time.value.trim() !== '')){
        const velocityValue = readNumber(velocity);
        const timeValue = readNumber(time);
        setDerivedValue(acceleration, velocityValue !== null && timeValue !== null ? velocityValue / timeValue : null);
    } else if(id === 'a'){
        setDerivedValue(time, null);
    }
    energies();
    works();
}

document.getElementById('mode').addEventListener('click', mode);

function mode(){
    const nextTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    const label = nextTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    document.body.setAttribute('data-theme', nextTheme);
    document.getElementById('mode').setAttribute('aria-label', label);
    document.getElementById('mode').setAttribute('title', label);
}

//Number Formatting Function : 
function formatNumber(number) {
    return number !== null && Number.isFinite(number) ? number.toLocaleString('en-US') : '';
}
