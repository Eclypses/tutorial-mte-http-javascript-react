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
import { fromByteArray } from 'base64-js';
import ReactDOM from 'react-dom';
import 'bootstrap';

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

  // Here is where you would want to set your state and defaults for the MTE

  const [sendMessage, setSendMessage] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendMessage(true);
  };

  // Here is where you want to create your functions to instantiate and setup the MTE
  // with the Encoder and the Decoder

  const handleFetch = async () => {
    // MTE Encoding the text would go here prior to sending over HTTP

    const response = await fetch(`http://${ip}:${port}/echo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: message,
    });

    setOutgoingEncodedMessage(message);

    if (response.ok) {
      const responseByteArray = await response.arrayBuffer();
      const byteArray = new Uint8Array(responseByteArray);

      // MTE Decoding the bytes would go here instead of using the Node TextDecoder
      const decodedReturn = new TextDecoder().decode(byteArray);

      setIncomingEncodedMessage(fromByteArray(byteArray));
      setDecodedMessage(decodedReturn);
    } else {
      console.error('Error hitting HTML endpoint');
    }

    setMessage('');
  };

  // Here is where you want to use the useEffect hook to call your functions that setup
  // the MTE and the Encoder and Decoder on first render

  useEffect(() => {
    if (sendMessage) {
      handleFetch();
      setSendMessage(false);
    }
  }, [sendMessage]);

  return (
    <div className='m-4'>
      <div className='container bg-light rounded p-4'>
        <div className='row'>
          <h1 className='display-6'>React HTTP MTE Tutorial</h1>
          <hr />
        </div>

        <div className='row'>
          <form>
            <div className='row'>
              <div className='col-4'>
                <label htmlFor='ip' className='form-label'>
                  IP
                </label>
                <input
                  type='text'
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setIp(e.currentTarget.value)
                  }
                  className='form-control'
                  placeholder='localhost'
                />
              </div>

              <div className='col-4'>
                <label htmlFor='port' className='form-label'>
                  Port
                </label>
                <input
                  type='text'
                  className='form-control'
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setPort(parseInt(e.currentTarget.value))
                  }
                  placeholder='27015'
                />
              </div>
            </div>
          </form>
        </div>

        <div className='col-md-12 mt-4'>
          <hr />
        </div>

        <form className='row g-3' onSubmit={(e) => handleSubmit(e)}>
          <div className='col-12 mt-4'>
            <label className='form-label'>
              Text To Send (Send 'quit' to exit)
            </label>
            <input
              type='text'
              value={message}
              onChange={(e: FormEvent<HTMLInputElement>) =>
                setMessage(e.currentTarget.value)
              }
              className='form-control'
              placeholder='Enter text to send...'
            />
          </div>

          <div className='col-12 mt-4'>
            <label className='form-label'>
              Encoded Text Sent To HTTP Server
            </label>
            <input
              type='text'
              value={outgoingEncodedMessage ? outgoingEncodedMessage : ''}
              className='form-control'
              disabled
            />
          </div>

          <div className='col-12 mt-4'>
            <label className='form-label'>
              Encoded Text Received From HTTP Server
            </label>
            <input
              type='text'
              value={incomingEncodedMessage ? incomingEncodedMessage : ''}
              className='form-control'
              disabled
            />
          </div>

          <div className='col-12 mt-4'>
            <label className='form-label'>
              Decoded Text Received From HTTP Server
            </label>
            <input
              type='text'
              value={decodedMessage ? decodedMessage : ''}
              className='form-control'
              disabled
            />
          </div>

          <div className='row mt-4'>
            <div className='col'>
              <button type='submit' className='btn btn-primary'>
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
