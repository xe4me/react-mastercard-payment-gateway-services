import React, { useEffect, useState , useCallback} from 'react';
import { Box, Button, Input, Flex, LoadingIndicator } from 'roo-ui/components';
import styled from '@emotion/styled';

const MERCHANT_ID = '';// use your merchant ID here
const MASTER_CARD_SESSION_JS_SRC = `https://test-cipg.mtf.gateway.mastercard.com/form/version/56/merchant/${MERCHANT_ID}/session.js`;
const MPGS_TIMEOUT = 5000;

const onScriptLoad = ({
  initialized,
  formSessionUpdate,
}) => {
  const { PaymentSession } = window;

  if (!PaymentSession) {
    return;
  }

  PaymentSession.configure({
    fields: {
      card: {
        number: "#card-number",
        securityCode: "#security-code",
        expiryMonth: "#expiry-month",
        expiryYear: "#expiry-year",
        nameOnCard: "#cardholder-name",
      },
    },
    frameEmbeddingMitigation: ["javascript"],
    callbacks: {
      initialized: (response) => {
        console.log('Session initialized', response);
        initialized(response);
      },
      formSessionUpdate: (response) => {
        console.log('Form session update', response);
        formSessionUpdate(response);
      },
    },
  });
};

const pay = () => {
  const { PaymentSession } = window;

  if (!PaymentSession) {
    return;
  }

  PaymentSession.updateSessionFromForm('card');
}

const loadScript = async (formSessionUpdate) => {
  if (!document) {
    return Promise.reject();
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject();
    }, MPGS_TIMEOUT);

    const prevScript = document.querySelector(`script[src="${MASTER_CARD_SESSION_JS_SRC}"]`);

    if (prevScript) {
      prevScript.remove();
    }

    const script = document.createElement('script');
    script.src = MASTER_CARD_SESSION_JS_SRC;
    script.async = 1;
    script.onerror = reject;
    script.onload = () => onScriptLoad({
      initialized: resolve,
      formSessionUpdate,
    });

    document.body.appendChild(script);
  });
}

const Wrapper = styled(Box)`
  iframe {
    display: block;
  }
`;

const Payment = ({
  onFormSessionUpdated,
}) => {
  const [initializing, setInitializing] = useState(true);

  const handleFormSessionUpdate = useCallback((response) => {
    // HANDLE RESPONSE FOR UPDATE SESSION
    if (response.status) {
      if ("ok" === response.status) {
        console.log("Session updated with data: " + response.session.id);
        onFormSessionUpdated(response.session.id);

        //check if the security code was provided by the user
        if (response.sourceOfFunds.provided.card.securityCode) {
          console.log("Security code was provided.");
        }

        //check if the user entered a Mastercard credit card
        if (response.sourceOfFunds.provided.card.scheme === 'MASTERCARD') {
          console.log("The user entered a Mastercard credit card.")
        }
      } else if ("fields_in_error" === response.status)  {
        console.log("Session update failed with field errors.");
        if (response.errors.cardNumber) {
          console.log("Card number invalid or missing.");
        }
        if (response.errors.expiryYear) {
          console.log("Expiry year invalid or missing.");
        }
        if (response.errors.expiryMonth) {
          console.log("Expiry month invalid or missing.");
        }
        if (response.errors.securityCode) {
          console.log("Security code invalid.");
        }
      } else if ("request_timeout" === response.status)  {
        console.log("Session update failed with request timeout: " + response.errors.message);
      } else if ("system_error" === response.status)  {
        console.log("Session update failed with system error: " + response.errors.message);
      }
    } else {
      console.log("Session update failed: " + response);
    }
  }, [onFormSessionUpdated])

  useEffect(() => {
    loadScript(handleFormSessionUpdate)
      .then(() => setInitializing(false))
      .catch(() => console.error('CANT NOT LOAD MPGS'));
  }, [handleFormSessionUpdate]);

  return (
    <Wrapper width="300px">
      {initializing && (
        <Flex position="absolute" top="0" right="0" bottom="0" left="0" bg="rgba(0, 0, 0, 0.1)" alignItems="center">
          <LoadingIndicator />
        </Flex>
      )}
      <Box my="2">Please enter your payment details:</Box>
      <h3>Credit Card</h3>
      <Box my="2">
        Card Number:
        <Input type="text" mb="0" id="card-number" title="card number" aria-label="enter your card number" readOnly />
      </Box>
      <Box my="2">
        Expiry Month:
        <select type="text" mb="0" id="expiry-month" title="expiry year" aria-label="two digit expiry year" readOnly >
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">Jun</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">November</option>
          <option value="11">October</option>
          <option value="12">December</option>
        </select>
      </Box>
      <Box my="2">
        Expiry Year:
        <select type="text" mb="0" id="expiry-year" title="expiry year" aria-label="two digit expiry year" readOnly >
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
          <option value="2030">2030</option>
          <option value="2031">2031</option>
          <option value="2033">2033</option>
        </select>
      </Box>
      <Box my="2">
        Security Code:
        <Input type="text" mb="0" id="security-code" title="security code" aria-label="three digit CCV security code" readOnly />
      </Box>
      <Box my="2">
        Cardholder Name:
        <Input type="text" mb="0" id="cardholder-name" title="cardholder name" aria-label="enter name on card" readOnly />
      </Box>
      <Box my="2">
        <Button variant="primary" onClick={pay}>
          Pay Now
        </Button>
      </Box>
    </Wrapper>
  );
}

const App = () => {
  const [toggle, setToggle] = useState(false);

  return (
    <Box p="4">
      {toggle && (<Payment onFormSessionUpdated={alert} />)}
      <Button onClick={() => setToggle(prevToggle => !prevToggle)}>Toggle</Button>
    </Box>
  );
};

export default App;
