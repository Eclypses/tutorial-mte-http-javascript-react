/*
THIS SOFTWARE MAY NOT BE USED FOR PRODUCTION. Otherwise,
The MIT License (MIT)

Copyright (c) Eclypses, Inc.

All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React, { useState, useEffect, FormEvent } from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap';
/* Step 2 */
import {
  MteBase,
  MteDec,
  MteEnc,
  MteStatus,
  MteWasm,
  MteMkeDec,
  MteMkeEnc,
  MteFlenEnc,
} from './Mte';
import { fromByteArray } from 'base64-js';

const App = () => {
  // This tutorial uses HTTP for communication.
  // It should be noted that the MTE can be used with any type of communication. (HTTP is not required!)

  const [port, setPort] = useState(27015);
  const [ip, setIp] = useState('localhost');
  const [message, setMessage] = useState('');
  const [outgoingEncodedMessage, setOutgoingEncodedMessage] = useState<
    string | null
  >('');
  const [incomingEncodedMessage, setIncomingEncodedMessage] = useState<
    string | null
  >('');
  const [decodedMessage, setDecodedMessage] = useState<string | null>('');

  /* Step 3 */
  // Add default state for MTE properties
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

  /* Step 3 CONTINUED... */
  // Add booleans to progress us to the next step because of how React's state works
  const [isMteInstantiated, setIsMteInstantiated] = useState(false);
  const [isMteTestsRun, setIsMteTestsRun] = useState(false);
  const [isEncoderCreated, setIsEncoderCreated] = useState(false);
  const [isDecoderCreated, setIsDecoderCreated] = useState(false);
  const [sendMessage, setSendMessage] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendMessage(true);
  };

  /* Step 4 */
  // Create function to instantiate MteWasm and MteBase
  const instantiateMte = async () => {
    const wasm = new MteWasm();
    await wasm.instantiate();
    const base = new MteBase(wasm);

    setWasm(wasm);
    setBase(base);
    setIsMteInstantiated(true);
  };

  /* Step 5 */
  // Create function to run MTE tests
  const runMteTests = () => {
    if (base) {
      const licenseCompany = 'Eclypses Inc.';
      const licenseKey = 'Eclypses123';

      // Check MTE license
      // Initialize MTE license. If a license code is not required (e.g., trial mode), this can be skipped.
      if (!base.initLicense(licenseCompany, licenseKey)) {
        const licenseStatus = MteStatus.mte_status_license_error;

        console.error(
          `License error (${base.getStatusName(
            licenseStatus,
          )}): ${base.getStatusDescription(licenseStatus)}`,
        );
      }

      setIsMteTestsRun(true);
    }
  };

  /* Step 6 */
  // Create Encoder
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
        mteEncoder.getDrbg(),
      );

      const encoderEntropy =
        entropyMinBytes > 0 ? '0'.repeat(entropyMinBytes) : '';
      const encoderNonce = '1';
      const encoderIdentifier = 'demo';

      // Set entropy and nonce for the encoder
      mteEncoder.setEntropyStr(encoderEntropy);
      mteEncoder.setNonce(encoderNonce);

      // Initialize MTE encoder with identifier
      const encoderStatus = mteEncoder.instantiate(encoderIdentifier);

      if (encoderStatus !== MteStatus.mte_status_success) {
        console.error(
          `Failed to initialize the MTE encoder engine.  Status: ${base.getStatusName(
            encoderStatus,
          )} / ${base.getStatusDescription(encoderStatus)}`,
        );
      } else {
        setEncoder(mteEncoder);
        setIsEncoderCreated(true);
      }
    }
  };

  /* Step 6 CONTINUED... */
  // Create Decoder
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
        mteDecoder.getDrbg(),
      );

      const decoderEntropy =
        entropyMinBytes > 0 ? '0'.repeat(entropyMinBytes) : '';
      const decoderNonce = '0';
      const decoderIdentifier = 'demo';

      // Set entropy and nonce for the encoder
      mteDecoder.setEntropyStr(decoderEntropy);
      mteDecoder.setNonce(decoderNonce);

      // Initialize MTE encoder with identifier
      const decoderStatus = mteDecoder.instantiate(decoderIdentifier);

      if (decoderStatus !== MteStatus.mte_status_success) {
        console.error(
          `Failed to initialize the MTE encoder engine.  Status: ${base.getStatusName(
            decoderStatus,
          )} / ${base.getStatusDescription(decoderStatus)}`,
        );
      } else {
        setDecoder(mteDecoder);
        setIsDecoderCreated(true);
      }
    }
  };

  const handleFetch = async () => {
    /* Step 7 */
    // Encode text to send and ensuring successful
    if (encoder && base) {
      const encodedReturn = encoder.encodeStrB64(message);

      if (encodedReturn.status !== MteStatus.mte_status_success) {
        console.error(
          `Error encoding: Status: ${base.getStatusName(
            encodedReturn.status,
          )} / ${base.getStatusDescription(encodedReturn.status)}`,
        );
      }

      setOutgoingEncodedMessage(encodedReturn.str);

      const response = await fetch(`http://${ip}:${port}/echo`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: encodedReturn.str,
      });

      if (response.ok) {
        const responseByteArray = await response.arrayBuffer();
        const byteArray = new Uint8Array(responseByteArray);

        /* Step 7 */
        // Decode incoming message and check for successful response
        if (decoder && base) {
          const decodedReturn = decoder.decodeStr(byteArray);

          setIncomingEncodedMessage(fromByteArray(byteArray));
          setDecodedMessage(decodedReturn.str);

          if (decodedReturn.status !== MteStatus.mte_status_success) {
            console.log(
              `Error decoding: Status: ${base.getStatusName(
                decodedReturn.status,
              )} / ${base.getStatusDescription(decodedReturn.status)}`,
            );
          }
        }
      } else {
        console.error('Error hitting HTML endpoint');
      }
    }

    setMessage('');
  };

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

  return (
    <div className="m-4">
      <div className="container bg-light rounded p-4">
        <div className="row">
          <h1 className="display-6">React HTTP MTE Tutorial</h1>
          <hr />
        </div>

        <div className="row">
          <form>
            <div className="row">
              <div className="col-4">
                <label htmlFor="ip" className="form-label">
                  IP
                </label>
                <input
                  type="text"
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setIp(e.currentTarget.value)
                  }
                  className="form-control"
                  placeholder="localhost"
                />
              </div>

              <div className="col-4">
                <label htmlFor="port" className="form-label">
                  Port
                </label>
                <input
                  type="text"
                  className="form-control"
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setPort(parseInt(e.currentTarget.value))
                  }
                  placeholder="27015"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="col-md-12 mt-4">
          <hr />
        </div>

        <form className="row g-3" onSubmit={(e) => handleSubmit(e)}>
          <div className="col-12 mt-4">
            <label className="form-label">
              Text To Send (Send 'quit' to exit)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e: FormEvent<HTMLInputElement>) =>
                setMessage(e.currentTarget.value)
              }
              className="form-control"
              placeholder="Enter text to send..."
            />
          </div>

          <div className="col-12 mt-4">
            <label className="form-label">
              Encoded Text Sent To HTTP Server
            </label>
            <input
              type="text"
              value={outgoingEncodedMessage ? outgoingEncodedMessage : ''}
              className="form-control"
              disabled
            />
          </div>

          <div className="col-12 mt-4">
            <label className="form-label">
              Encoded Text Received From HTTP Server
            </label>
            <input
              type="text"
              value={incomingEncodedMessage ? incomingEncodedMessage : ''}
              className="form-control"
              disabled
            />
          </div>

          <div className="col-12 mt-4">
            <label className="form-label">
              Decoded Text Received From HTTP Server
            </label>
            <input
              type="text"
              value={decodedMessage ? decodedMessage : ''}
              className="form-control"
              disabled
            />
          </div>

          <div className="row mt-4">
            <div className="col">
              <button type="submit" className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
