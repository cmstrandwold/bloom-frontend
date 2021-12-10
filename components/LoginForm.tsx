import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import * as React from 'react';
import { useState } from 'react';
import { useGetUserMutation } from '../app/api';
import { auth } from '../config/firebase';
import { LOGIN_ERROR, LOGIN_REQUEST, LOGIN_SUCCESS } from '../constants/events';
import logEvent, { getEventUserData } from '../utils/logEvent';

const containerStyle = {
  marginY: 3,
} as const;

const LoginForm = () => {
  const t = useTranslations('Auth.form');
  const router = useRouter();
  let codeParam = router.query.code;

  if (codeParam instanceof Array) {
    codeParam = codeParam + '';
  }

  const [formError, setFormError] = useState<
    | string
    | React.ReactNodeArray
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
  >();
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [getUser, { isLoading: getUserIsLoading }] = useGetUserMutation();

  const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    logEvent(LOGIN_REQUEST, { partner: 'bumble' });

    auth
      .signInWithEmailAndPassword(emailInput, passwordInput)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const token = await user?.getIdToken();
        if (token) {
          localStorage.setItem('accessToken', token);
        }
        const userResponse = await getUser('');
        if ('data' in userResponse) {
          logEvent(LOGIN_SUCCESS, { ...getEventUserData(userResponse.data) });
          router.push('/therapy-booking');
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        logEvent(LOGIN_ERROR, { partner: 'bumble', message: errorCode });

        if (errorCode === 'auth/invalid-email') {
          setFormError(t('firebase.invalidEmail'));
        }
        if (errorCode === 'auth/user-not-found' || 'auth/wrong-password') {
          setFormError(t('firebase.authError'));
        }
      });
  };

  return (
    <Box sx={containerStyle}>
      <form autoComplete="off" onSubmit={submitHandler}>
        <TextField
          id="email"
          onChange={(e) => setEmailInput(e.target.value)}
          label={t.rich('emailLabel')}
          variant="standard"
          fullWidth
          required
        />
        <TextField
          id="password"
          onChange={(e) => setPasswordInput(e.target.value)}
          label={t.rich('passwordLabel')}
          type="password"
          variant="standard"
          fullWidth
          required
        />
        {formError && (
          <Typography variant="body2" component="p" color="primary.dark" mb={2}>
            {formError}
          </Typography>
        )}

        <Button
          sx={{ mt: 2, mr: 1.5 }}
          variant="contained"
          fullWidth
          color="secondary"
          type="submit"
        >
          {t.rich('loginSubmit')}
        </Button>
      </form>
    </Box>
  );
};

export default LoginForm;
