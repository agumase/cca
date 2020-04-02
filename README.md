# Canonical Correlation Analysis

Reference: http://numerical.recipes/whp/notes/CanonCorrBySVD.pdf

## R cancor() help

```
## signs of results are random
pop <- LifeCycleSavings[, 2:3]
oec <- LifeCycleSavings[, -(2:3)]
cancor(pop, oec)
```

## Results of R cancor()

```
$cor
[1] 0.8247966 0.3652762

$xcoef
              [,1]        [,2]
pop15 -0.009110856 -0.03622206
pop75  0.048647514 -0.26031158

$ycoef
             [,1]          [,2]          [,3]
sr   0.0084710221  3.337936e-02 -5.157130e-03
dpi  0.0001307398 -7.588232e-05  4.543705e-06
ddpi 0.0041706000 -1.226790e-02  5.188324e-02

$xcenter
  pop15   pop75
35.0896  2.2930

$ycenter
       sr       dpi      ddpi
   9.6710 1106.7584    3.7576
```

## Results of cancor.py

```
cor [0.8248 0.3653]
xcoef [[-0.0091 -0.0362]
 [ 0.0486 -0.2603]]
ycoef [[ 8.4710e-03  3.3379e-02 -5.1571e-03]
 [ 1.3074e-04 -7.5882e-05  4.5437e-06]
 [ 4.1706e-03 -1.2268e-02  5.1883e-02]]
xcenter pop15    35.0896
pop75     2.2930
dtype: float64
ycenter sr         9.6710
dpi     1106.7584
ddpi       3.7576
```

<img src="https://raw.githubusercontent.com/taneishi/cca/master/cca/result.png" width="300" alt="cca" />

[CCA result of DrugBank interactions](https://taneishi.github.io/cca)

<img src="https://raw.githubusercontent.com/taneishi/cca/master/cca/drugbank.png" width="300" alt="drugbank" />
