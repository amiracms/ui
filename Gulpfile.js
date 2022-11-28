"use strict";

const gulp = require('gulp');
const through = require('through2');
const fs = require('fs');

gulp.task('build', function() {
    return gulp.src([
            './src/*.jsx',
            './src/**/*.jsx'
        ])
        .pipe(transpiler())
        .pipe(gulp.dest('./lib'));
});

function transpiler() {
    const babel = require('@babel/core');

    return through.obj(function(file, enc, cb) {
        if (!file.isBuffer()) {
            return cb();
        }

        const content = babel.transform(file.contents.toString());

        if (!content.code) {
            return cb();
        }

        file.contents = Buffer.from(content.code);

        if (file.path && !file.path.match(/\.min.js/)) {
            file.path = file.path.replace('.jsx', '.js');
        }

        cb(null, file);
    });
}