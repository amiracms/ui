"use strict";

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

const bundles = [
    "react", 
    "react-dom",
    "axios",
    "underscore",
    "htmlparser2",
    "path-to-regexp",
    "history",
    "ua-parser-js",
    "formik",
    "yup"
];

gulp.task('build', function() {

});