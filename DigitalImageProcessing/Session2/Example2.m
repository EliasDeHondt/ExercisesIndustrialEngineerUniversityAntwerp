% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Exercise 2: Region Properties
rice = imread('rice.gif');
figure, imshow(rice);

bw = imbinarize(rice);
bw = bwareaopen(bw, 20);
labeled = bwlabel(bw);
stats = regionprops(labeled,'Area','PixelIdxList');

areas = [stats.Area];
avgArea = mean(areas);

good = bw;
for k = 1:length(stats)
    if stats(k).Area < avgArea
        good(stats(k).PixelIdxList) = 0;
    end
end

subplot(1,2,1), imshow(rice), title('Original grains');
subplot(1,2,2), imshow(good), title('Filtered grains');

badCount = sum(areas < avgArea);
fprintf('Bad grains removed: %d\n', badCount);