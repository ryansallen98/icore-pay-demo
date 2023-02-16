const pathSegments = window.location.pathname.split('/');
const custom = pathSegments[pathSegments.length - 1];
const invoice = document.getElementById('invoice-id').value;
const address = document.getElementById('address-display').value;
const amount = document.getElementById('amount-display').value;
window.addEventListener('load', checkStatus());

function checkStatus() {
    fetch(`/ispaid?data={"custom":"${custom}", "invoice":"${invoice}"}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const truth = data.found;
            if (truth) {
                document.getElementById('status').style.color = 'green';
                document.getElementById('status').innerText = 'Paid';
                document.getElementById('download-pdf').style.display = 'block';
                document.getElementById('submit').style.display = 'none';
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

form.addEventListener('submit', loading);

function loading() {
    document.getElementById('submit').innerText = 'Please wait...';
}

/*
const addressFormated = address.split(",").join("<br />");
const amountFormated = amount.split(",");
const sum = amountFormated.reduce((total, num) => {
    return total + parseInt(num);
}, 0);
document.getElementById('address-display').innerHTML = addressFormated;
document.getElementById('amount-display').innerText = '$' + sum;
document.getElementById('success').value = window.location.href;
document.getElementById('cancel').value = window.location.href;
document.getElementById('ipn').value = window.location.origin + '/ipn';
*/

// Add the PDF download functionality
const downloadPDF = () => {
    const pdf = new jsPDF();
    const receipt = document.querySelector("#receipt");

    // Add CSS styles to set text color to black
    receipt.style.color = "black";

    pdf.fromHTML(receipt, 15, 15, {
        width: 170
    });
    pdf.save("receipt.pdf");
    receipt.style.color = "#c9ced6";
};

document.querySelector("#download-pdf").addEventListener("click", downloadPDF);