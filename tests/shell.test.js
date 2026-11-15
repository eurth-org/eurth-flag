// The checks every Eurth tool runs: contrast, security headers, privacy, launch secrecy, pages
// and the launch date. They read the built site, so run "npm run build" first (CI does).
import { standardSuites } from '@eurth/style/testing';
import { site } from '../eurth.config.mjs';

standardSuites({ site });
