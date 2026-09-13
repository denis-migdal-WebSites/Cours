#!/usr/bin/bash

# livereload dist/docs/api
# http://127.0.0.1:35729/modules.html (?)

DIST_DIR="./dist/docs/api"
BUILD_DIR="./build/docs/api"

# initialize
if [ -d "$BUILD_DIR" ] ; then

    pip3 install sphinx

    mkdir -p "$BUILD_DIR"
    mkdir -p "$DIST_DIR"

    sphinx-quickstart "$BUILD_DIR" \
        --quiet \
        --project "API" \
        --author "Me" \
        --release "0.1" \
        --language fr \
        --no-makefile \
        --no-batchfile \
        --extensions sphinx.ext.autodoc,sphinx.ext.napoleon

    cat <<<EOF >> ./build/docs/api/conf.py
        autodoc_typehints = "both"

        #napoleon_google_docstring = True
        #napoleon_numpy_docstring = True

        import os
        import sys
        sys.path.insert(0, os.path.abspath('../../../src'))
    EOF
fi

sphinx-apidoc ./src -o "$BUILD_DIR"
sphinx-build -b html   "$BUILD_DIR" "$DIST_DIR"

#.. code-block:: python
#    foo(42)
