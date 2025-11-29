% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 1
img = zeros(20,60);
img(5:9, 4:8) = 1;
img(6:9, 12:16) = 1;
img(5:8, 22:26) = 1;
figure; imshow(img); title('Original Binary Image');

se1 = strel('square',3);
se2 = strel('disk',2);
se3 = strel('line',5,0);
se4 = strel('line',5,90);
d1 = imdilate(img,se1);
d2 = imdilate(img,se2);
d3 = imdilate(img,se3);
e1 = imerode(img,se1);
e2 = imerode(img,se2);
e3 = imerode(img,se3);
figure;
subplot(3,3,1); imshow(d1); title('Dilation - square');
subplot(3,3,2); imshow(d2); title('Dilation - disk');
subplot(3,3,3); imshow(d3); title('Dilation - horizontal');
subplot(3,3,4); imshow(e1); title('Erosion - square');
subplot(3,3,5); imshow(e2); title('Erosion - disk');
subplot(3,3,6); imshow(e3); title('Erosion - horizontal');

SE_orange = [1 1 1 1 1 1 1;
             1 1 1 1 1 1 1;
             1 1 1 1 1 1 1;
             1 1 1 1 1 1 1;
             1 1 1 1 1 1 1];
SE_orange = strel(SE_orange);
d_orange = imdilate(img, SE_orange);
e_orange = imerode(img, SE_orange);
figure;
subplot(1,3,1); imshow(img); title('Original');
subplot(1,3,2); imshow(d_orange); title('Dilation - Orange SE');
subplot(1,3,3); imshow(e_orange); title('Erosion - Orange SE');