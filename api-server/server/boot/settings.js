import { check } from 'express-validator/check';
import { ifNoUser401, createValidatorErrorHandler } from '../utils/middleware';
import { themes } from '../../common/utils/themes.js';
import { alertTypes } from '../../common/utils/flash.js';

export default function settingsController(app) {
  const api = app.loopback.Router();
  const toggleUserFlag = (flag, req, res, next) => {
    const { user } = req;
    const currentValue = user[flag];
    return user.update$({ [flag]: !currentValue }).subscribe(
      () =>
        res.status(200).json({
          flag,
          value: !currentValue
        }),
      next
    );
  };

  function refetchCompletedChallenges(req, res, next) {
    const { user } = req;
    return user
      .requestCompletedChallenges()
      .subscribe(completedChallenges => res.json({ completedChallenges }), next);
  }

  const updateMyEmailValidators = [
    check('email')
      .isEmail()
      .withMessage('Email format is invalid.')
  ];

  function updateMyEmail(req, res, next) {
    const {
      user,
      body: { email }
    } = req;
    return user
      .requestUpdateEmail(email)
      .subscribe(message => res.json({ message }), next);
  }

  const updateMyCurrentChallengeValidators = [
    check('currentChallengeId')
      .isMongoId()
      .withMessage('currentChallengeId is not a valid challenge ID')
  ];

  function updateMyCurrentChallenge(req, res, next) {
    const {
      user,
      body: { currentChallengeId }
    } = req;
    return user.update$({ currentChallengeId }).subscribe(
      () =>
        res.json({
          message: `your current challenge has been updated to ${currentChallengeId}`
        }),
      next
    );
  }

  const updateMyThemeValidators = [
    check('theme')
      .isIn(Object.keys(themes))
      .withMessage('Theme is invalid.')
  ];

  function updateMyTheme(req, res, next) {
    const {
      body: { theme }
    } = req;
    if (req.user.theme === theme) {
      return res.sendFlash(alertTypes.info, 'Theme already set');
    }
    return req.user
      .updateTheme(theme)
      .then(
        () => res.sendFlash(alertTypes.info, 'Your theme has been updated'),
        next
      );
  }

  function updateFlags(req, res, next) {
    const {
      user,
      body: { values }
    } = req;
    const keys = Object.keys(values);
    if (keys.length === 1 && typeof keys[0] === 'boolean') {
      return toggleUserFlag(keys[0], req, res, next);
    }
    return user
      .requestUpdateFlags(values)
      .subscribe(message => res.json({ message }), next);
  }

  function updateMyPortfolio(req, res, next) {
    const {
      user,
      body: { portfolio }
    } = req;
    // if we only have one key, it should be the id
    // user cannot send only one key to this route
    // other than to remove a portfolio item
    const requestDelete = Object.keys(portfolio).length === 1;
    return user
      .updateMyPortfolio(portfolio, requestDelete)
      .subscribe(message => res.json({ message }), next);
  }

  function updateMyProfileUI(req, res, next) {
    const {
      user,
      body: { profileUI }
    } = req;
    return user
      .updateMyProfileUI(profileUI)
      .subscribe(message => res.json({ message }), next);
  }

  function updateMyProjects(req, res, next) {
    const {
      user,
      body: { projects: project }
    } = req;
    return user
      .updateMyProjects(project)
      .subscribe(message => res.json({ message }), next);
  }

  function updateMyUsername(req, res, next) {
    const {
      user,
      body: { username }
    } = req;
    return user
      .updateMyUsername(username)
      .subscribe(message => res.json({ message }), next);
  }

  const updatePrivacyTerms = (req, res) => {
    const {
      user,
      body: { quincyEmails }
    } = req;
    const update = {
      acceptedPrivacyTerms: true,
      sendQuincyEmail: !!quincyEmails
    };
    return user.updateAttributes(update, err => {
      if (err) {
        return res.status(500).json({
          type: 'warning',
          message:
            'Something went wrong updating your preferences. ' +
            'Please try again.'
        });
      }
      return res.status(200).json({
        type: 'success',
        message:
          'We have updated your preferences. ' +
          'You can now continue using freeCodeCamp.'
      });
    });
  };

  api.put('/update-privacy-terms', ifNoUser401, updatePrivacyTerms);

  api.post(
    '/refetch-user-completed-challenges',
    ifNoUser401,
    refetchCompletedChallenges
  );
  api.post('/update-flags', ifNoUser401, updateFlags);
  api.put(
    '/update-my-email',
    ifNoUser401,
    updateMyEmailValidators,
    createValidatorErrorHandler(alertTypes.danger),
    updateMyEmail
  );
  api.post(
    '/update-my-current-challenge',
    ifNoUser401,
    updateMyCurrentChallengeValidators,
    createValidatorErrorHandler(alertTypes.danger),
    updateMyCurrentChallenge
  );
  api.post(
    '/update-my-current-challenge',
    ifNoUser401,
    updateMyCurrentChallengeValidators,
    createValidatorErrorHandler(alertTypes.danger),
    updateMyCurrentChallenge
  );
  api.post('/update-my-portfolio', ifNoUser401, updateMyPortfolio);
  api.post('/update-my-profile-ui', ifNoUser401, updateMyProfileUI);
  api.post('/update-my-projects', ifNoUser401, updateMyProjects);
  api.post(
    '/update-my-theme',
    ifNoUser401,
    updateMyThemeValidators,
    createValidatorErrorHandler(alertTypes.danger),
    updateMyTheme
  );
  api.post('/update-my-username', ifNoUser401, updateMyUsername);

  app.use('/external', api);
  app.use('/internal', api);
  app.use(api);
}