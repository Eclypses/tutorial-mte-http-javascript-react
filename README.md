<img src="./Eclypses.png" style="width:50%;margin-right:0;"/>

<div align="center" style="font-size:40pt; font-weight:900; font-family:arial; margin-top:300px;">
React HTTP Tutorial</div>

<div align="center" style="font-size:15pt; font-family:arial; " >
Using MTE version 3.1.x</div>

# Introduction

This tutorial shows you how to implement the MTE into an existing HTTP connection. This is only one example, the MTE does NOT require the usage of HTTP, you can use whatever communication protocol that is needed.

This tutorial demonstrates how to use MTE Core, MTE MKE and MTE Fixed Length. Depending on what your needs are, these three different implementations can be used in the same application OR you can use any one of them. They are not dependent on each other and can run simultaneously in the same application if needed.

The SDK that you received from Eclypses may not include the MKE or MTE FLEN add-ons. If your SDK contains either the MKE or the Fixed Length add-ons, the name of the SDK will contain "-MKE" or "-FLEN". If these add-ons are not there and you need them please work with your sales associate. If there is no need, please just ignore the MKE and FLEN options.

Here is a short explanation of when to use each, but it is encouraged to either speak to a sales associate or read the dev guide if you have additional concerns or questions.

**_MTE Core:_** This is the recommended version of the MTE to use. Unless payloads are large or sequencing is needed this is the recommended version of the MTE and the most secure.

**_MTE MKE:_** This version of the MTE is recommended when payloads are very large, the MTE Core would, depending on the token byte size, be multiple times larger than the original payload. Because this uses the MTE technology on encryption keys and encrypts the payload, the payload is only enlarged minimally.

**_MTE Fixed Length:_** This version of the MTE is very secure and is used when the resulting payload is desired to be the same size for every transmission. The Fixed Length add-on is mainly used when using the sequencing verifier with MTE. In order to skip dropped packets or handle asynchronous packets the sequencing verifier requires that all packets be a predictable size. If you do not wish to handle this with your application then the Fixed Length add-on is a great choice. This is ONLY an encoder change - the decoder that is used is the MTE Core decoder.

In this tutorial we are creating an MTE Encoder and a MTE Decoder on a client that exists in the browser. This is only needed when there are messages being sent from both sides. If only one side of your application is sending messages, then the side that sends the messages should have an MTE Encoder and the side receiving the messages needs only an MTE Decoder. You will need to pair this with a server in order for the HTTP requests to communicate.

**IMPORTANT:**

**NOTE:** _The solution provided in this tutorial does NOT include the MTE library or any supporting MTE library files. If you have NOT been provided a MTE library and supporting files, please contact Eclypses Inc. Solution will only work AFTER MTE library and any required MTE library files have been included._

**NOTE:** _This tutorial is provided in TypeScript. If you are not using TypeScript and instead using JavaScript, simply ignore the additional TypeScript syntax in the instructions. You will receive the same result._

# Tutorial Overview

The structure of this tutorial is as follows:

```bash
.
├── start
└── finish
```

| Directory | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `finish`  | Example of project after completing the tutorial to reference             |
| `start`   | Project where you can follow along with the tutorial to implement the MTE |

_There is only a client version of this tutorial. It is recommended to follow an additional Eclypses tutorial with a different language/framework that supports a server using the HTTP communication protocol in order to successfully pair them together._

# MTE Implementation

1. **Add MTE to your project**

   - Locate the TypeScript or JavaScript MTE compressed directory that was provided to you
   - Add the `Mte.ts` file into your project solution

2. **Import the following from `Mte.ts`**

   ```typescript
   import {
     MteDec, // Only if you are using MTE Core
     MteEnc, // Only if you are using MTE Core
     MteStatus,
     MteBase,
     MteWasm,
     MteMkeDec, // Only if you are using MKE
     MteMkeEnc, // Only if you are using MKE
     MteFlenEnc, // Only if you are using MTE FLEN
   } from "./Mte";
   ```

3. **Add default state for the following MTE properties that we will need to globally access inside of our component.**

```typescript
const [wasm, setWasm] = useState<MteWasm>();
const [base, setBase] = useState<MteBase>();

//---------------------------------------------------
// Comment out to use MKE or MTE FLEN instead of MTE Core
//---------------------------------------------------
const [encoder, setEncoder] = useState<MteEnc>();
const [decoder, setDecoder] = useState<MteDec>();

//---------------------------------------------------
// Uncomment to use MKE instead of MTE Core
//---------------------------------------------------
// const [encoder, setEncoder] = useState<MteMkeEnc>();
// const [decoder, setDecoder] = useState<MteMkeDec>();

//---------------------------------------------------
// Uncomment to use MTE FLEN instead of MTE Core
//---------------------------------------------------
// const [fixedLength] = useState(8);
// const [encoder, setEncoder] = useState<MteFlenEnc>();
// const [decoder, setDecoder] = useState<MteDec>();
```

Because of how React's `useState` hook works, it doesn't update immediately. Thus, we will need to breakup some of MTE's steps into separate functions and activate each step using booleans once we're sure our previous state has been set. Add the following booleans:

```typescript
const [isMteInstantiated, setIsMteInstanted] = useState(false);
const [isMteTestsRun, setIsMteTestsRun] = useState(false);
const [isEncoderCreated, setIsEncoderCreated] = useState(false);
const [isDecoderCreated, setIsDecoderCreated] = useState(false);
```

4. **Create an async function to instantiate the `MteWasm` and `MteBase`.**

   - `MteWasm` should only be instantiated once in your application.
   - This method returns a promise, so make sure you `await` it in an async function.
   - `MteBase` gives us access to MTE helper methods.
     - You must pass an instantiated `MteWasm` into `MteBase`.
   - At the end of the function, we will use our first boolean signifying that we have instantiated the MTE so that we can access the state of `wasm` and `base` in later functions

   ```typescript
   const instantiateMte = async () => {
     const wasm = new MteWasm();
     await wasm.instantiate();
     const base = new MteBase(wasm);

     setWasm(wasm);
     setBase(base);
     setIsMteInstantiated(true);
   };
   ```

5. \*\*To ensure the MTE library is licensed correctly run the license check

   - The `licenseCompanyName`, and `licenseKey` below should be replaced with your company’s MTE license information provided by Eclypses. If a trial version of the MTE is being used, any value can be passed into those fields for it to work.
   - At the end of the function, we will use our third boolean signifying that we have ran the license test

   ```typescript
   const runMteTests = () => {
     if (base) {
       const licenseCompany = "Eclypses Inc.";
       const licenseKey = "Eclypses123";

       // Check MTE license
       // Initialize MTE license. If a license code is not required (e.g., trial mode), this can be skipped.
       if (!base.initLicense(licenseCompany, licenseKey)) {
         const licenseStatus = MteStatus.mte_status_license_error;

         console.error(
           `License error (${base.getStatusName(
             licenseStatus
           )}): ${base.getStatusDescription(licenseStatus)}`
         );
       }
     }
   };
   ```

6. **Create MTE Decoder Instance and MTE Encoder Instances.**

   - Each Encoder and Decoder require three values. These values should be treated like encryption keys and never exposed. For demonstration purposes in this tutorial we are simply allowing default values of 0 to be set. In a production environment these values should be protected and not available to outside sources. For the entropy, we have to determine the size of the allowed entropy value based on the drbg we have selected.

     - Entropy
       - To set the entropy in the tutorial we are getting the minimum bytes required and creating a string of that length that contains all zeros.
       - You will need an instance of the encoder or decoder to get the correct entropy based on the DRBG that they are using with the helper method `getDrbg()`
     - Nonce
       - We are adding 1 to the encoder nonce so that the return value changes. This is optional, the same nonce can be used for the encoder and decoder. Server side values will be switched so they match up to the encoder/decoder and vice versa.
     - Identifier

   - At the end of the functions, we are using our third and fourth boolean signifying that we have created the Encoder as well as created the Decoder to be able to be used in future functions

   Here is a sample that creates the MTE Decoder.

   ```typescript
   const createDecoder = () => {
     if (wasm && base) {
       //---------------------------------------------------
       // Comment out to use MKE instead of MTE Core
       //---------------------------------------------------
       const mteDecoder = MteDec.fromdefault(wasm);

       //---------------------------------------------------
       // Uncomment to use MKE instead of MTE Core
       //---------------------------------------------------
       // const mteDecoder = MteMkeDec.fromdefault(wasm);

       const entropyMinBytes = base.getDrbgsEntropyMinBytes(
         mteDecoder.getDrbg()
       );

       const decoderEntropy =
         entropyMinBytes > 0 ? "0".repeat(entropyMinBytes) : "";
       const decoderNonce = "0";
       const decoderIdentifier = "demo";

       // Set entropy and nonce for the encoder
       mteDecoder.setEntropyStr(decoderEntropy);
       mteDecoder.setNonce(decoderNonce);

       // Initialize MTE encoder with identifier
       const decoderStatus = mteDecoder.instantiate(decoderIdentifier);

       if (decoderStatus !== MteStatus.mte_status_success) {
         console.error(
           `Failed to initialize the MTE encoder engine.  Status: ${base.getStatusName(
             decoderStatus
           )} / ${base.getStatusDescription(decoderStatus)}`
         );
       } else {
         setDecoder(mteDecoder);
         setIsDecoderCreated(true);
       }
     }
   };
   ```

- (For further info on Decoder constructor – Check out the Developers Guide)\*

  Here is a sample function that creates the MTE Encoder.

  ```typescript
  const createEncoder = () => {
    if (wasm && base) {
      //---------------------------------------------------
      // Comment out to use MKE or MTE FLEN instead of MTE Core
      //---------------------------------------------------
      const mteEncoder = MteEnc.fromdefault(wasm);

      //---------------------------------------------------
      // Uncomment to use MKE instead of MTE Core
      //---------------------------------------------------
      // const mteEncoder = MteMkeEnc.fromdefault(wasm);

      //---------------------------------------------------
      // Uncomment to use MTE FLEN instead of MTE Core
      //---------------------------------------------------
      // const mteEncoder = MteFlenEnc.fromdefault(wasm, fixedLength);

      const entropyMinBytes = base.getDrbgsEntropyMinBytes(
        mteEncoder.getDrbg()
      );

      const encoderEntropy =
        entropyMinBytes > 0 ? "0".repeat(entropyMinBytes) : "";
      const encoderNonce = "1";
      const encoderIdentifier = "demo";

      // Set entropy and nonce for the encoder
      mteEncoder.setEntropyStr(encoderEntropy);
      mteEncoder.setNonce(encoderNonce);

      // Initialize MTE encoder with identifier
      const encoderStatus = mteEncoder.instantiate(encoderIdentifier);

      if (encoderStatus !== MteStatus.mte_status_success) {
        console.error(
          `Failed to initialize the MTE encoder engine.  Status: ${base.getStatusName(
            encoderStatus
          )} / ${base.getStatusDescription(encoderStatus)}`
        );
      } else {
        setEncoder(mteEncoder);
        setIsEncoderCreated(true);
      }
    }
  };
  ```

  - (For further info on Encode constructor – Check out the Developers Guide)\*

7. **Next, we need to add the MTE calls to encode and decode the messages that we are sending and receiving inside of the `handleFetch()` function.**

- Ensure the Encoder is called to encode the outgoing text, then the Decoder is called to decode the incoming response.
- Please check out the Developers Guide for further information on the various encoding and decoding methods. In this tutorial, we are using a method that takes a string and encodes to a string. The Decoder is taking a byte array and decoding to a string.

Here is a sample of how to do this for the encoder

```typescript
// Encode text to send and ensuring successful
if (encoder && base) {
  const encodedReturn = encoder.encodeStrB64(message);

  if (encodedReturn.status !== MteStatus.mte_status_success) {
    console.error(
      `Error encoding: Status: ${base.getStatusName(
        encodedReturn.status
      )} / ${base.getStatusDescription(encodedReturn.status)}`
    );
  }
}
```

Here is a sample of how to do this for the decoder

```typescript
// Decode incoming message and check for successful response
if (decoder && base) {
  const decodedReturn = decoder.decodeStr(byteArray);

  if (decodedReturn.status !== MteStatus.mte_status_success) {
    console.error(
      `Error decoding: Status: ${base.getStatusName(
        decodedReturn.status
      )} / ${base.getStatusDescription(decodedReturn.status)}`
    );
  }
}
```

8. **Lastly, we need to use React's `UseEffect` hooks to trigger all our functions in the correct order. This is where those booleans will come in handy.**

   - First, we instantiate the MTE on initial render

   - Second, we setup the MTE options

   - Third, we run the MTE tests

   - Fourth, we create the encoder and the decoder

   - And finally, we modify the existing `useEffect` hook to ensure the encoder and decoder have been created prior to sending the message

     ```typescript
     useEffect(() => {
       instantiateMte();
     }, []);

     useEffect(() => {
       if (isMteInstantiated) {
         runMteTests();
       }
     }, [isMteInstantiated]);

     useEffect(() => {
       if (isMteTestsRun) {
         createEncoder();
         createDecoder();
       }
     }, [isMteTestsRun]);

     useEffect(() => {
       if (sendMessage && isEncoderCreated && isDecoderCreated) {
         handleFetch();
         setSendMessage(false);
       }
     }, [sendMessage]);
     ```

**_The Client side of the MTE HTTP React Tutorial should now be ready for use on your device._**

<div style="page-break-after: always; break-after: page;"></div>

# Contact Eclypses

<img src="Eclypses.png" style="width:8in;"/>

<p align="center" style="font-weight: bold; font-size: 22pt;">For more information, please contact:</p>
<p align="center" style="font-weight: bold; font-size: 22pt;"><a href="mailto:info@eclypses.com">info@eclypses.com</a></p>
<p align="center" style="font-weight: bold; font-size: 22pt;"><a href="https://www.eclypses.com">www.eclypses.com</a></p>
<p align="center" style="font-weight: bold; font-size: 22pt;">+1.719.323.6680</p>

<p style="font-size: 8pt; margin-bottom: 0; margin: 300px 24px 30px 24px; " >
<b>All trademarks of Eclypses Inc.</b> may not be used without Eclypses Inc.'s prior written consent. No license for any use thereof has been granted without express written consent. Any unauthorized use thereof may violate copyright laws, trademark laws, privacy and publicity laws and communications regulations and statutes. The names, images and likeness of the Eclypses logo, along with all representations thereof, are valuable intellectual property assets of Eclypses, Inc. Accordingly, no party or parties, without the prior written consent of Eclypses, Inc., (which may be withheld in Eclypses' sole discretion), use or permit the use of any of the Eclypses trademarked names or logos of Eclypses, Inc. for any purpose other than as part of the address for the Premises, or use or permit the use of, for any purpose whatsoever, any image or rendering of, or any design based on, the exterior appearance or profile of the Eclypses trademarks and or logo(s).
</p>
