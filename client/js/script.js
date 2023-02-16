 // counter to keep track of how many merchant fields have been added
 let merchantCounter = 1;
 document.getElementById("merchantCounter").value = merchantCounter;
 /**
  * Creates a new form element for a merchant's address and amount
  * and appends it after the first merchant element
  */
 function addMerchant() {

     // increment the merchant counter
     merchantCounter++;
     document.getElementById("merchantCounter").value = merchantCounter;


     const firstMerchant = document.querySelector('.merchant');
     const newMerchant = document.createElement('div');
     newMerchant.classList.add('merchant');
     newMerchant.setAttribute('id', "counter-" + merchantCounter);

     // Create new input wrappers
     const newInputWrapper1 = document.createElement('div');
     newInputWrapper1.classList.add('input-wrapper');
     const newInputWrapper2 = document.createElement('div');
     newInputWrapper2.classList.add('input-wrapper');

     // Create new labels
     const newLabel1 = document.createElement('label');
     newLabel1.innerText = 'eToken Address'
     const newLabel2 = document.createElement('label');
     newLabel2.innerText = 'Amount'

     // Create merchant address input
     const merchantAddrInput = document.createElement('input');
     merchantAddrInput.setAttribute('id', `merchant-addr-${merchantCounter}`);
     merchantAddrInput.setAttribute('name', `merchant-addr-${merchantCounter}`);
     merchantAddrInput.setAttribute('type', 'text');
     merchantAddrInput.setAttribute('required', true);
     merchantAddrInput.setAttribute('class', 'input');

     // Create amount input
     const amountInput = document.createElement('input');
     amountInput.setAttribute('id', `amount-${merchantCounter}`);
     amountInput.setAttribute('name', `amount-${merchantCounter}`);
     amountInput.setAttribute('type', 'text');
     amountInput.setAttribute('required', true);
     amountInput.setAttribute('class', 'input');

     // Create delete button
     const deleteButton = document.createElement('button');
     deleteButton.innerText = 'x';
     deleteButton.setAttribute('class', 'btn-clear');
     deleteButton.setAttribute('type', 'button');
     deleteButton.addEventListener('click', function () {
         deleteMerchant(this);
     });

     // Append elements to the new merchant element
     newInputWrapper1.appendChild(newLabel1);
     newInputWrapper1.appendChild(merchantAddrInput);
     newInputWrapper2.appendChild(newLabel2);
     newInputWrapper2.appendChild(amountInput);
     newMerchant.appendChild(newInputWrapper1);
     newMerchant.appendChild(newInputWrapper2);
     newMerchant.appendChild(deleteButton);


     // insert the new div element after the first merchant element
     firstMerchant.insertAdjacentElement('afterend', newMerchant);
 }
 /**
  * Removes a merchant element when the delete button is clicked
  */
 function deleteMerchant(elem) {
     // get the parent div of the delete button (the merchant div)
     const targetMerchant = document.getElementById(`counter-${merchantCounter}`)
     // remove the targeted merchant div element
     targetMerchant.parentNode.removeChild(targetMerchant);
     // decrement the merchant counter
     merchantCounter--;
     document.getElementById("merchantCounter").value = merchantCounter;
 }

document.getElementById('success').value = window.location.href;
document.getElementById('cancel').value = window.location.href;
document.getElementById('ipn').value = window.location.origin + '/ipn';