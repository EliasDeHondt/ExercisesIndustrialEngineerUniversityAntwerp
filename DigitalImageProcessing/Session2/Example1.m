% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 1: Region Properties

pollen = imread('pollen.tif');
bone   = imread('bone-scan-GE.tif');

imtool(pollen,[]);
imtool(bone,[]);

pollen_d = im2double(pollen);
bone_d   = im2double(bone);

[x,y] = deal(100,150);
fprintf('Original pollen value: %d\n', pollen(x,y));
fprintf('Double pollen value: %f\n', pollen_d(x,y));

fprintf('Original bone value: %d\n', bone(x,y));
fprintf('Double bone value: %f\n', bone_d(x,y));

pollen = imread('pollen.tif');
bone   = imread('bone-scan-GE.tif');
imtool(pollen,[]);
imtool(bone,[]);
pollen_d = im2double(pollen);
bone_d   = im2double(bone);
[x,y] = deal(100,150);
fprintf('Original pollen value: %d\n', pollen(x,y));
fprintf('Double pollen value: %f\n', pollen_d(x,y));
fprintf('Original bone value: %d\n', bone(x,y));
fprintf('Double bone value: %f\n', bone_d(x,y));