const pathSegments = window.location.pathname.split('/');
const custom = pathSegments[pathSegments.length - 1];
const invoice = document.getElementById('invoice-id').innerText;
const address = document.getElementById('address-display').innerText;
const amount = document.getElementById('amount-display').innerText;
const payUrl = document.getElementById('submit').href;
const button = document.getElementById('submit');

document.getElementById('qr-wrapper').style.display = 'none';
window.addEventListener('load', checkStatus());

console.log(custom, invoice)

function checkStatus() {
    fetch(`/ispaid?data={"custom":"${custom}", "invoice":"${invoice}"}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            const truth = data.found;
            if (truth) {
                document.getElementById('status').style.color = 'green';
                document.getElementById('status').innerText = 'Paid';
                document.getElementById('submit').style.display = 'none';
                document.getElementById('qr-button').style.display = 'none';
                document.getElementById('title').innerText = 'Receipt';
            } else {
                document.getElementById('status').style.color = 'red';
                document.getElementById('status').innerText = 'Unpaid';
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
setTimeout(function () {
    checkStatus();
}, 1000);

document.querySelector("#submit").addEventListener("click", loading);

function loading() {
    document.getElementById('submit-button').innerText = 'Please wait...';
}

const addressFormated = address.split(",").join("<br />");
const amountFormated = amount.split(",");
const sum = amountFormated.reduce((total, num) => {
    return total + parseInt(num);
}, 0);
document.getElementById('address-display').innerHTML = addressFormated;
document.getElementById('amount-display').innerText = '$' + sum;

let payId;

async function getQR() {
    console.log(payUrl)
    // create a new request for the QR code
    let qrImage,
        qrReq,
        qrHeader = new Headers();
    qrHeader.append('Accept', 'image/png');
    qrReq = new Request(payUrl, {
        method: 'GET',
        headers: qrHeader,
        mode: 'cors'
    });
    fetch(qrReq)
        .then(response => response.blob())
        .then((blob) => {
            qrImage = URL.createObjectURL(blob)
            //set the QR code image source
            document.getElementById('qr-code').src = qrImage;
            document.getElementById('qr-button').style.display = 'none'
            document.getElementById('qr-wrapper').style.display = 'block';
        })
        .catch((err) => {
            console.log('ERROR:', err.message);
        });
}