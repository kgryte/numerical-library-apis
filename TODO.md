# TODO

> TODO items.

1.  [MXNet](https://numpy.mxnet.io/api/deepnumpy/routines.array-creation.html)
2.  Perform join across various databases
    -   Use NumPy as reference
        -   [x] CuPy
        -   [x] Dask
        -   [x] JAX
        -   [x] PyTorch
        -   [x] Sparse
        -   [ ] Tensorflow

3.  Dask missing
    -   trace
    -   unify_chunks
    -   random.permutation
    -   blockwise appears twice

4.  CuPy missing
    -  abs (prob because no doc link)
    -  max
    -  min
    -  fromfile
    -  round_
    -  searchsorted
    -  size
    -  NumPy cross references
        -  `count_nonzero`
        -  `diagflat`
        -  `divide`
        -  `copy`
        -  `in1d`
        -  `iscomplex`
        -  `iscomplexobj`
        -  `isfortran`
        -  `isin`
        -  `isreal`
        -  `isrealobj`
        -  `linalg.matrix_power`
        -  `linalg.norm`
        -  `linspace`
        -  `logspace`
        -  `matmul`
        -  `mod`
        -  `nan_to_num`
        -  `non_equal`
        -  `pad`
        -  `random.randint`
        -  `random.random_integers`
        -  `random.random`
        -  `random.ranf`
        -  `random.sample`
        -  `random.seed`
        -  `vsplit`
        -  `vstack`

5.  Add sparse methods, similar to the `numpy_methods` database

6.  Comments

    -  would seem that any kind of tensor/ndarray API should be as limited as possible and focus on array attributes (shape, dtype, etc), creation (ones, zeros, full, etc), manipulation (transpose, sort, tile, squeeze, etc), and access/traversal (e.g., indexing, where/find, etc)
    -  a tensor/ndarray API should provide a universal interface to apply, e.g., univariate functions elementwise (aka, ufuncs) rather than expose a grab bag of special functions (e.g., sin, cos, etc) which can be implemented and imported via another library and then applied to array elements
    -  a tensor/ndarray API should provide a universal interface to perform axis-wise operations (e.g., sums, means, stats, etc)
    -  linear algebra, machine learning, etc, should then be a layer which sits on top of, and consumes, this standardized tensor/ndarray API
