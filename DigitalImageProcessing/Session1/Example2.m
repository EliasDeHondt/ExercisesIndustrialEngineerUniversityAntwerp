% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Exercise 2

% 2.1. Create a random 100x100 matrix
M = randi([0 255], 100, 100);


% 2.2. Logical thresholding
N = M >= 100;


% 2.3. Show both images
figure
imshow(uint8(M))
title('Original grayscale M')

figure
imshow(N)
title('Binary N (manual threshold)')


% 2.4. Automatic binarization
M_norm = double(M) / 255;
N_auto = imbinarize(M_norm, 100/255);


% 2.5. Compare
figure
imshowpair(N, N_auto, 'montage')
title('Manual threshold vs imbinarize')